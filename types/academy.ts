// types/academy.ts
import { Timestamp } from "firebase/firestore";

export interface ClassData {
  id: string;
  instructorId: string;
  ownerId?: string;
  name: string;        // 반 이름 (예: 서울고 1등급반)
  targetSchool?: string; // 주 타겟 학교
  schedule?: string;   // 수업 시간 (예: 월/수 7시)
  studentCount: number; // 학생 수 (집계용)
  createdAt: Timestamp;
}

export interface StudentData {
  id: string;
  instructorId: string;
  classId: string;     // 소속 반 ID
  name: string;
  school?: string;     // 학교
  phone?: string;
  parentPhone?: string;     
  joinedAt: Timestamp;
}

export interface CounselingLog {
  id: string;
  studentId: string;
  type: '상담' | '전화' | '특이사항' | '과제';
  content: string;
  authorName: string;
  createdAt: any; // Timestamp
}

// --- [신규] 출석 관리 타입 ---
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

export interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string; // 지각 사유 등
}

export interface DailyAttendance {
  id: string; // 날짜 (YYYY-MM-DD)를 ID로 사용
  date: string;
  records: AttendanceRecord[];
}

// --- [신규] 과제 관리 타입 ---
export type AssignmentStatus = 'completed' | 'incomplete' | 'late';

export interface AssignmentRecord {
  studentId: string;
  studentName: string;
  status: AssignmentStatus;
  score?: string; // 점수나 등급 (A, B, C...)
}

export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  description?: string;
  records: AssignmentRecord[]; // 학생별 수행 결과
  createdAt: any;
}