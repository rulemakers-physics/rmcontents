// types/grade.ts
import { Timestamp } from "firebase/firestore";

export interface ScoreData {
  studentId: string;
  studentName: string;
  score: number;
  note?: string; // 학생별 특이사항 (예: 계산 실수 많음)
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