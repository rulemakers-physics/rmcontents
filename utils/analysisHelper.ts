// utils/analysisHelper.ts

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, documentId, Timestamp } from "firebase/firestore";
import { ExamResultData } from "@/types/grade";
import { SavedExam } from "@/types/exam";

// Python API 주소
const ANALYSIS_API_URL = "https://asia-northeast3-rmcontents1.cloudfunctions.net/calculate-weakness";

export interface AnalysisResult {
  topic: string;
  score: number;
  problemCount: number;
}

// [신규] 난이도별 점수 매핑 (높을수록 어려움)
const DIFFICULTY_SCORE: Record<string, number> = {
  '킬러': 5,
  '상': 4,
  '중': 3,
  '하': 2,
  '기본': 1
};

export async function analyzeCumulativeWeakness(studentId: string, classId: string): Promise<AnalysisResult[]> {
  try {
    // 1. 성적 데이터 조회
    const resultsRef = collection(db, "exam_results");
    const qResults = query(resultsRef, where("classId", "==", classId));
    const resultsSnap = await getDocs(qResults);

    const myResults = resultsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ExamResultData))
      .filter(r => r.scores.some(s => s.studentId === studentId));

    if (myResults.length === 0) return [];

    // 2. 원본 시험지 조회
    const examIds = [...new Set(myResults.map(r => r.examId).filter(id => !!id))] as string[];
    if (examIds.length === 0) return [];

    // (Firestore 'in' 쿼리 10개 제한 대응: 최신순 10개만 분석에 사용)
    const recentExamIds = examIds.slice(0, 10);
    const examsRef = collection(db, "saved_exams");
    const qExams = query(examsRef, where(documentId(), "in", recentExamIds)); 
    const examsSnap = await getDocs(qExams);
    
    const examsMap: Record<string, SavedExam> = {};
    examsSnap.docs.forEach(doc => {
      examsMap[doc.id] = { id: doc.id, ...doc.data() } as SavedExam;
    });

    // 3. 데이터 수집 및 가중치 계산
    const rawDataPoints: { topic: string; isCorrect: number; weight: number }[] = [];
    const activeTopicsSet = new Set<string>();

    const now = new Date();

    myResults.forEach(result => {
      if (!result.examId || !examsMap[result.examId]) return;
      const savedExam = examsMap[result.examId];

      // 시험 응시일 기준 시간 가중치 계산 (최근일수록 높음)
      // 예: 오늘=1.0, 30일전=약 0.7, 60일전=약 0.4
      const examDate = result.date instanceof Timestamp ? result.date.toDate() : new Date();
      const daysDiff = Math.max(0, (now.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
      const timeWeight = Math.exp(-0.015 * daysDiff); // 감쇠 계수 조절 (0.015 -> 약 45일 지나면 가중치 절반)

      const studentScore = result.scores.find(s => s.studentId === studentId);
      if (!studentScore || !studentScore.results) return;

      savedExam.problems.forEach((p) => {
        if (!p.majorTopic) return;
        
        const isCorrect = studentScore.results![p.number] ? 1 : 0;
        
        // [핵심] 난이도 가중치 로직 적용
        const diffScore = DIFFICULTY_SCORE[p.difficulty || '중'] || 3;
        
        let difficultyWeight = 1;
        if (isCorrect === 1) {
          // 맞았을 때: 어려운 문제일수록 가중치 UP (실력 입증)
          difficultyWeight = diffScore; 
        } else {
          // 틀렸을 때: 쉬운 문제일수록 가중치 UP (실수/개념 부족 강조)
          // 킬러(5) -> 가중치 1 (틀려도 타격 적음)
          // 기본(1) -> 가중치 5 (틀리면 타격 큼)
          difficultyWeight = 6 - diffScore; 
        }

        // 최종 샘플 가중치 = 시간 가중치 * 난이도 가중치
        const finalWeight = timeWeight * difficultyWeight;

        rawDataPoints.push({ 
          topic: p.majorTopic, 
          isCorrect, 
          weight: finalWeight 
        });
        
        activeTopicsSet.add(p.majorTopic);
      });
    });

    const activeTopics = Array.from(activeTopicsSet);

    if (rawDataPoints.length < 5 || activeTopics.length === 0) {
      return [];
    }

    // 4. 가중 선형 회귀를 위한 행렬 구성 (Weighted Least Squares)
    // 원리: 각 행(Sample)에 sqrt(weight)를 곱해주면, 중요도가 높은 데이터가 오차 계산에 더 큰 영향을 줍니다.
    const matrix_X: number[][] = [];
    const vector_Y: number[] = [];

    rawDataPoints.forEach((point) => {
      const topicIndex = activeTopics.indexOf(point.topic);
      
      if (topicIndex !== -1) {
        // One-Hot Vector 생성
        const row = new Array(activeTopics.length).fill(0);
        
        // [중요] 가중치 적용: X와 y에 모두 가중치를 곱해서 데이터의 "비중"을 늘립니다.
        // 여기서는 단순하게 선형 가중치를 적용합니다. (엄밀한 WLS는 sqrt를 곱하지만, 휴리스틱하게 score 자체를 곱해도 무방)
        row[topicIndex] = point.weight; 

        matrix_X.push(row);
        
        // 정답(1)이면 weight만큼, 오답(0)이면 0이 됨
        vector_Y.push(point.isCorrect * point.weight);
      }
    });

    // 5. Python API 호출
    const response = await fetch(ANALYSIS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrix_X, vector_Y }),
    });

    const data = await response.json();
    const weights: number[] = data.weights || [];

    // 6. 결과 매핑
    return activeTopics.map((topic, idx) => {
      // 계산된 가중치는 0~1 사이가 아닐 수 있으므로 클리핑 및 스케일링
      let rawScore = weights[idx] || 0;
      
      // 정규화: (0~1 범위로 보정)
      // 난이도 가중치가 반영되었으므로 점수 분포가 달라질 수 있음. 
      // 단순하게 0.8 이상이면 마스터, 0.4 이하면 취약 등으로 해석되도록 100점 만점으로 환산
      const score = Math.max(0, Math.min(1, rawScore)) * 100;
      
      const count = rawDataPoints.filter(p => p.topic === topic).length;

      return { 
        topic, 
        score: Math.round(score),
        problemCount: count
      };
    });

  } catch (e) {
    console.error("Cumulative Analysis Failed:", e);
    return [];
  }
}