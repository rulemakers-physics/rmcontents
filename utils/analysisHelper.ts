// utils/analysisHelper.ts

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { SCIENCE_UNITS } from "@/types/scienceUnits";
import { ExamResultData } from "@/types/grade";
import { SavedExam } from "@/types/exam";

// 분석 기준이 될 대단원 목록 (고정된 순서)
export const ANALYSIS_TOPICS = SCIENCE_UNITS.flatMap(s => s.majorTopics.map(m => m.name));

// Python API 주소 (배포한 Cloud Function URL)
const ANALYSIS_API_URL = "https://asia-northeast3-rmcontents1.cloudfunctions.net/calculate-weakness";

export interface AnalysisResult {
  topic: string;
  score: number;
}

/**
 * 학생의 누적된 시험 데이터를 바탕으로 취약점을 분석합니다.
 * @param studentId 분석할 학생 ID
 * @param classId 학생이 속한 반 ID (성적 조회용)
 */
export async function analyzeCumulativeWeakness(studentId: string, classId: string): Promise<AnalysisResult[]> {
  try {
    // 1. 해당 반의 모든 시험 결과 조회
    const resultsRef = collection(db, "exam_results");
    const qResults = query(resultsRef, where("classId", "==", classId));
    const resultsSnap = await getDocs(qResults);

    // 학생이 응시한 시험 결과만 필터링
    const myResults = resultsSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as ExamResultData))
      .filter(r => r.scores.some(s => s.studentId === studentId));

    if (myResults.length === 0) return [];

    // 2. 관련된 원본 시험지(SavedExam) ID 수집
    // (문제의 단원 정보를 알기 위함)
    const examIds = [...new Set(myResults.map(r => r.examId).filter(id => !!id))] as string[];
    
    if (examIds.length === 0) return [];

    // 3. 원본 시험지 정보 가져오기 (Firestore 'in' 쿼리는 최대 10개 제한 주의 - 여기선 단순화)
    // 실제로는 examIds를 10개씩 쪼개서 요청하거나, 필요한 데이터만 별도로 저장하는 것이 좋습니다.
    const examsRef = collection(db, "saved_exams");
    // (간단한 구현을 위해 10개 이하라고 가정, 많으면 청크 로직 필요)
    const qExams = query(examsRef, where(documentId(), "in", examIds.slice(0, 10))); 
    const examsSnap = await getDocs(qExams);
    
    const examsMap: Record<string, SavedExam> = {};
    examsSnap.docs.forEach(doc => {
      examsMap[doc.id] = { id: doc.id, ...doc.data() } as SavedExam;
    });

    // 4. 행렬(X)과 벡터(y) 구성 (데이터 누적)
    const matrix_X: number[][] = [];
    const vector_Y: number[] = [];

    myResults.forEach(result => {
      const savedExam = examsMap[result.examId!];
      if (!savedExam) return; // 원본 시험지가 삭제된 경우 스킵

      const studentScore = result.scores.find(s => s.studentId === studentId);
      if (!studentScore || !studentScore.results) return;

      // 해당 시험의 모든 문제에 대해 루프
      savedExam.problems.forEach((p) => {
        // 단원 인덱스 찾기
        const topicIndex = ANALYSIS_TOPICS.indexOf(p.majorTopic || "");
        
        if (topicIndex !== -1) {
          // X: 단원 정보 (One-Hot Encoding)
          const row = new Array(ANALYSIS_TOPICS.length).fill(0);
          row[topicIndex] = 1; // 해당 단원에 1 표시
          
          // (옵션) 난이도 가중치: '킬러' 문제는 맞추면 더 높은 점수 반영
          // if (p.difficulty === '킬러') row[topicIndex] = 2.0;

          matrix_X.push(row);

          // y: 정오답 결과 (맞음 1, 틀림 0)
          const isCorrect = studentScore.results![p.number];
          vector_Y.push(isCorrect ? 1 : 0);
        }
      });
    });

    if (matrix_X.length < 5) {
      // 데이터가 너무 적으면 분석 불가 (최소 5문제 이상)
      console.warn("데이터 부족으로 분석 중단");
      return [];
    }

    // 5. Python API 호출
    const response = await fetch(ANALYSIS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrix_X, vector_Y }),
    });

    const data = await response.json();
    const weights: number[] = data.weights || [];

    // 6. 결과 매핑 (0~100점 스케일로 변환)
    return ANALYSIS_TOPICS.map((topic, idx) => {
      let score = weights[idx] || 0;
      // 회귀분석 결과(가중치)는 -무한대 ~ +무한대 일 수 있으므로 보기 좋게 보정
      // 일반적으로 0.0 ~ 1.0 사이가 나오지만, 극단적인 경우를 대비해 클램핑
      score = Math.max(0, Math.min(1, score)) * 100;
      
      return { topic, score: Math.round(score) };
    });

  } catch (e) {
    console.error("Cumulative Analysis Failed:", e);
    return [];
  }
}