// utils/analysisHelper.ts

import { SCIENCE_UNITS } from '@/types/scienceUnits';
import { ExamResultData } from '@/types/grade';
import { SavedExam } from '@/types/exam';

// 분석 기준이 될 대단원 목록 추출 (순서 고정)
export const ANALYSIS_TOPICS = SCIENCE_UNITS.flatMap(s => s.majorTopics.map(m => m.name));

// Python API 주소 (배포 후 받은 URL로 교체하세요)
const ANALYSIS_API_URL = "https://asia-northeast3-rmcontents1.cloudfunctions.net/calculate-weakness";

export interface AnalysisResult {
  topic: string;
  score: number; // 계산된 숙련도 (가중치)
}

export async function analyzeStudentWeakness(
  result: ExamResultData, 
  exam: SavedExam, 
  studentId: string
): Promise<AnalysisResult[]> {
  
  const studentScore = result.scores.find(s => s.studentId === studentId);
  if (!studentScore || !studentScore.results) {
    throw new Error("학생의 성적 데이터가 없습니다.");
  }

  const matrix_X: number[][] = [];
  const vector_Y: number[] = [];

  // 1. 문항별 데이터 구성 (행렬 생성)
  exam.problems.forEach((p) => {
    // 해당 문항의 대단원이 목록에 있는지 확인
    const topicIndex = ANALYSIS_TOPICS.indexOf(p.majorTopic || "");
    
    if (topicIndex !== -1) {
      // One-Hot Encoding: 해당 단원 인덱스만 1, 나머지는 0
      const row = new Array(ANALYSIS_TOPICS.length).fill(0);
      row[topicIndex] = 1; 
      
      // 난이도 가중치 추가 (선택 사항: 킬러 문제는 맞추면 가중치를 더 줌)
      // if (p.difficulty === '킬러') row[topicIndex] = 1.5;

      matrix_X.push(row);

      // 정오답 결과 (맞음: 1, 틀림: 0)
      const isCorrect = studentScore.results![p.number];
      vector_Y.push(isCorrect ? 1 : 0);
    }
  });

  if (matrix_X.length === 0) return [];

  // 2. Python API 호출
  try {
    const response = await fetch(ANALYSIS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matrix_X, vector_Y }),
    });

    const data = await response.json();
    const weights: number[] = data.weights;

    // 3. 결과 매핑 (단원명 - 점수)
    // weights 값은 보통 0~1 사이지만, 회귀분석 특성상 음수나 1초과가 나올 수 있음.
    // 보기 좋게 0~100점으로 정규화하여 반환
    return ANALYSIS_TOPICS.map((topic, idx) => {
      let score = weights[idx] || 0;
      // 점수 보정 (0 이하는 0점, 1 이상은 100점으로 클램핑)
      score = Math.max(0, Math.min(1, score)) * 100;
      
      return { topic, score: Math.round(score) };
    });

  } catch (e) {
    console.error("AI Analysis Failed:", e);
    return [];
  }
}