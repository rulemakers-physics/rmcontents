import { Timestamp } from "firebase/firestore";
import { LayoutMode } from "./examTemplates";

// ... (ExamPaperProblem 인터페이스는 기존 유지) ...
export interface ExamPaperProblem {
  id: string;
  number: number;
  content?: string;
  imageUrl?: string | null;
  answer?: string | null;
  solutionUrl?: string | null;
  difficulty?: string;
  majorTopic?: string;
  minorTopic?: string;
  height?: number;         
  solutionHeight?: number; 
}

export interface SavedExam {
  id: string;
  userId: string;
  title: string;
  instructorName: string;
  
  createdAt: Timestamp | Date;
  problemCount: number;
  folderId?: string;
  
  problems: ExamPaperProblem[];
  templateId?: string;
  
  // 레이아웃 설정
  layoutMode?: LayoutMode;
  questionPadding?: number; 
  // [삭제됨] solutionPadding 
  
  // 학원 로고
  academyLogo?: string | null;
}

export interface PrintOptions {
  questions: boolean;
  answers: boolean;
  solutions: boolean;
  questionPadding: number;
  // [삭제됨] solutionPadding: number; 
  layoutMode: LayoutMode;
}