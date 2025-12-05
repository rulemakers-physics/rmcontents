// types/problem.ts

export type Difficulty = '기본' | '하' | '중' | '상' | '킬러';
export type QuestionType = '객관식' | '서답형';

// [신규] 유사 문항 정보 타입
export interface SimilarProblemInfo {
  targetFilename: string;
  score: number;
}

export interface DBProblem {
  id: string;
  filename: string;
  content: string;
  unit: string;
  majorTopic: string;
  minorTopic: string;
  difficulty: Difficulty;
  difficultyScore: number;
  imgUrl: string;
  solutionUrl?: string;
  answer?: string;
  imgHeight?: number;      
  solutionHeight?: number;
  // [신규] 유사 문항 리스트 필드 추가
  similarProblems?: SimilarProblemInfo[]; 
  createdAt: any;
}

// 화면용 데이터 (변경 없음)
export interface ExamProblem {
  id: string;
  number: number;
  imageUrl: string | null;
  content: string;
  difficulty: string;
  majorTopic?: string;
  minorTopic?: string;
  answer?: string | null;
  solutionUrl?: string | null;
}