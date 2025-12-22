// types/marketing.ts

import { Timestamp } from "firebase/firestore";

export interface ExamProblemData {
  number: number;
  answer: number; // 1~5
  score: number;  // 배점
}

export interface MarketingExam {
  id: string;           // 시험 ID (문서 ID와 동일, 예: '2025_march_mock')
  title: string;        // 시험 제목
  isActive: boolean;    // 활성화 여부 (응시 가능 여부)
  createdAt: Timestamp;
  
  // 문항 데이터
  problems: ExamProblemData[];
  totalQuestions: number;
  totalScore: number;

  // 파일 링크
  questionPaperUrl?: string; // 문제지 PDF
  solutionPaperUrl?: string; // 해설지 PDF
  lectureUrl?: string;       // 해설 강의 링크 (Youtube 등)
}

export interface MarketingExamResult {
  id: string;
  examId: string;
  phone: string;
  score: number;
  answers: Record<string, number>;
  results: Record<string, boolean>;
  submittedAt: Timestamp;
}