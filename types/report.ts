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
  relatedId?: string;
  dueDate?: Date;
  isDone: boolean;
}

// [수정] 전문적인 리포트를 위한 필드 확장
export interface WeeklyReport {
  id: string;
  classId: string;
  className: string;
  instructorId: string;
  weekStartDate: string; // YYYY-MM-DD (월요일 기준)
  
  status: 'draft' | 'published';
  
  // 1. 학습 내용 요약
  summary: string;       // 금주 수업 총평 (진도 내용 등)
  nextWeekPlan?: string; // [신규] 차주 수업 계획
  notice?: string;       // [신규] 가정통신문/공지사항

  // 2. 반 통계 (자동 계산용)
  classStats?: {
    attendanceRate: number; // 출석률 (%)
    homeworkRate: number;   // 과제 수행률 (%)
    testAverage?: number;   // 주간 테스트 평균 (있을 경우)
  };

  // 3. 학생별 상세 데이터
  studentFeedbacks: {
    studentId: string;
    studentName: string;
    comment: string;           // 개별 코멘트
    attendanceState?: string;  // [신규] 이번 주 출석 상태 요약 (예: "2회 출석, 0회 지각")
    testScore?: string;        // [신규] 이번 주 테스트 점수 요약
    homeworkState?: string;    // [신규] 과제 수행 상태
  }[];

  createdAt: Timestamp;
  publishedAt?: Timestamp;
}