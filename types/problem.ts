// types/problem.ts

export type Difficulty = '기본' | '하' | '중' | '상' | '킬러';
export type QuestionType = '객관식' | '서답형';

// Firestore에 저장된 실제 데이터 모양
export interface DBProblem {
  id: string;
  filename: string;
  content: string;
  unit: string;        // 예: "통합과학 1"
  majorTopic: string;  // 예: "1. 과학의 기초"
  minorTopic: string;  // 예: "시간과 공간"
  difficulty: Difficulty;      // "상", "킬러" 등 (화면 표시용)
  difficultyScore: number;     // 0, 1.0, 1.5 등 (정렬/로직용)
  imgUrl: string;
  solutionUrl?: string;
  answer?: string;
  createdAt: any;
}

// 화면(ExamPaperLayout)에서 사용할 데이터 모양
export interface ExamProblem {
  id: string;
  number: number;
  imageUrl: string | null;
  content: string;
  difficulty: string;
  majorTopic?: string;
  minorTopic?: string;
}