// utils/analysisHelper.ts

import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { ExamResultData } from "@/types/grade";
import { SavedExam } from "@/types/exam";

// Python API 주소
const ANALYSIS_API_URL = "https://asia-northeast3-rmcontents1.cloudfunctions.net/calculate-weakness";

export interface AnalysisResult {
  topic: string;
  score: number;
  problemCount: number; // [신규] 해당 단원 문제 수 (신뢰도 판단용)
}

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

    // (Firestore 'in' 쿼리 10개 제한 대응 로직 필요 - 여기선 단순화)
    const examsRef = collection(db, "saved_exams");
    const qExams = query(examsRef, where(documentId(), "in", examIds.slice(0, 10))); 
    const examsSnap = await getDocs(qExams);
    
    const examsMap: Record<string, SavedExam> = {};
    examsSnap.docs.forEach(doc => {
      examsMap[doc.id] = { id: doc.id, ...doc.data() } as SavedExam;
    });

    // --- [핵심 개선] 3. 데이터 수집 및 "등장한 단원" 식별 ---
    const rawDataPoints: { topic: string; isCorrect: number }[] = [];
    const activeTopicsSet = new Set<string>(); // 학생이 한 번이라도 푼 단원들

    myResults.forEach(result => {
      const savedExam = examsMap[result.examId!];
      if (!savedExam) return;

      const studentScore = result.scores.find(s => s.studentId === studentId);
      if (!studentScore || !studentScore.results) return;

      savedExam.problems.forEach((p) => {
        if (!p.majorTopic) return;
        
        // 문제 풀이 데이터 수집
        const isCorrect = studentScore.results![p.number] ? 1 : 0;
        rawDataPoints.push({ topic: p.majorTopic, isCorrect });
        
        // "이 단원은 풀어봤음" 표시
        activeTopicsSet.add(p.majorTopic);
      });
    });

    // 분석할 단원 목록 (푼 적 있는 단원만)
    const activeTopics = Array.from(activeTopicsSet);

    if (rawDataPoints.length < 5 || activeTopics.length === 0) {
      console.warn("데이터 부족으로 분석 중단");
      return [];
    }

    // 4. 행렬(X)과 벡터(y) 구성 (동적 크기)
    const matrix_X: number[][] = [];
    const vector_Y: number[] = [];

    rawDataPoints.forEach((point) => {
      // 해당 문제가 어떤 'Active Topic'에 속하는지 인덱스 찾기
      const topicIndex = activeTopics.indexOf(point.topic);
      
      if (topicIndex !== -1) {
        // One-Hot Encoding (동적 크기)
        const row = new Array(activeTopics.length).fill(0);
        row[topicIndex] = 1;

        matrix_X.push(row);
        vector_Y.push(point.isCorrect);
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
      let score = weights[idx] || 0;
      score = Math.max(0, Math.min(1, score)) * 100;
      
      // 해당 단원의 문제 풀이 수 카운트 (신뢰도 표시용)
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