// types/grade.ts
import { Timestamp } from "firebase/firestore";

export interface WrongProblemInfo {
  id: string;     // 문제 DB ID
  number: number; // 원본 시험지에서의 문항 번호 (예: 5번)
}

export interface ScoreData {
  studentId: string;
  studentName: string;
  score: number;
  note?: string;
  answers?: Record<number, string>;
  results?: Record<number, boolean>;
  
  // [수정] 단순 ID 배열(string[]) -> 번호 포함 객체 배열로 변경
  wrongProblems?: WrongProblemInfo[]; 
}

export interface ExamResultData {
  id: string;
  classId: string;
  className: string;
  examId?: string;    // 연결된 시험지 ID (선택)
  examTitle: string;  // 시험명 (예: 3월 월례고사)
  date: Timestamp;
  scores: ScoreData[]; // 학생별 점수 배열
  average: number;     // 반 평균 (자동 계산)
  highest: number;     // 최고점
  totalStudents: number;
}