// types/academy.ts
import { Timestamp } from "firebase/firestore";

export interface ClassData {
  id: string;
  instructorId: string;
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