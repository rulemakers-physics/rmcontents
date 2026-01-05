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
  materialLevel?: string;
  customLabel?: string;
}

export interface SavedExam {
  id: string;
  userId: string;       // 작성자(강사) ID
  ownerId?: string;     // [신규] 소유주(원장) ID - 데이터 조회 권한 기준
  title: string;
  // [신규] 부제목 및 학원명 필드 추가
  subTitle?: string;
  academyName?: string;
  
  instructorName: string;
  
  createdAt: Timestamp | Date;
  problemCount: number;
  folderId?: string;
  
  problems: ExamPaperProblem[];
  templateId?: string;
  
  // 레이아웃 설정
  layoutMode?: LayoutMode;
  questionPadding?: number; 
  
  // 학원 로고
  academyLogo?: string | null;
  // [신규] 클리닉 관련 필드 추가
  isClinic?: boolean;       // 클리닉 여부
  parentExamId?: string;    // 원본 시험지 ID (연결용)
  studentName?: string;     // 클리닉 대상 학생 이름

  // [신규] 반 종속성 필드 추가
  classId?: string;   // 시험지가 배정된 반 ID
  className?: string; // 반 이름 (표시용)
}

export interface PrintOptions {
  questions: boolean;
  answers: boolean;
  solutions: boolean;
  questionPadding: number;
  // [삭제됨] solutionPadding: number; 
  layoutMode: LayoutMode;
}