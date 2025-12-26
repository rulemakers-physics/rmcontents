// types/problem.ts

export type Difficulty = '기본' | '하' | '중' | '상' | '킬러';
export type QuestionType = 'SELECTION' | 'ESSAY';

// [신규] 유사 문항 정보 타입
export interface SimilarProblemInfo {
  targetFilename: string;
  score: number;
}
// [신규] 자료 유형 상세 정보 (Boolean Flags)
export interface ProblemDataTypes {
  graph: boolean;       // 그래프
  image: boolean;       // 그림/도식
  text: boolean;        // 박스 지문/발문
  table: boolean;       // 표
  calculation?: boolean; // 계산 (선택)
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
  questionType: QuestionType | string; // "SELECTION"
  questionTypeLabel?: string;          // "객관식" (UI 표시용)
  imgUrl: string;
  solutionUrl?: string;
  answer?: string;
  imgHeight?: number;      
  solutionHeight?: number;
  // [신규] 유사 문항 리스트 필드 추가
  similarProblems?: SimilarProblemInfo[];
  // [NEW] 소재 수준 필드 추가
  materialLevel?: string; // "학교 교과서" | "그 외" | "심화 교과"
  createdAt: any;

  // --- [신규 추가 필드 (태그)] ---
  // 이 필드들만 update_tags.js로 업데이트됩니다.
  
  // 1. 자료 유형 (그래프, 표, 그림 등)
  dataTypes?: ProblemDataTypes; 
  
  // 2. 융합형 문항 여부
  isConvergence?: boolean;      
  
  // 3. 질문 세부 형식 (예: "기본 선지형", "보기 선택형")
  questionTypeDetail?: string;  
  
}

// 화면용 데이터 (기존 유지)
export interface ExamProblem extends DBProblem {
  number: number;
  imageUrl: string | null;
  customLabel?: string;
}