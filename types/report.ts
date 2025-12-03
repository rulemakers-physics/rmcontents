// types/report.ts
import { Timestamp } from "firebase/firestore";

export type TaskType = 'GRADE_ENTRY' | 'WEEKLY_REPORT' | 'COUNSELING_NEEDED';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ActionItem {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  priority: TaskPriority;
  relatedId?: string; // classId, studentId, or examId
  dueDate?: Date;
  isDone: boolean;
}

export interface WeeklyReport {
  id: string;
  classId: string;
  className: string;
  instructorId: string;
  weekStartDate: string; // YYYY-MM-DD
  status: 'draft' | 'published';
  summary: string;       // 금주 학습 총평
  studentFeedbacks: {
    studentId: string;
    studentName: string;
    comment: string;     // 개별 코멘트
  }[];
  createdAt: Timestamp;
  publishedAt?: Timestamp;
}