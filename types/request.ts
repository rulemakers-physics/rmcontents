// types/request.ts
import { Timestamp } from "firebase/firestore";

export type RequestStatus = "requested" | "in_progress" | "completed" | "rejected";

export interface ReferenceFile {
  name: string;
  url: string;
  path: string;
}

export interface RequestData {
  id: string;
  title: string;
  instructorId: string;
  instructorName: string;
  academy: string;
  status: RequestStatus;
  contentKind: string;
  quantity: number;
  questionCount: string;
  deadline: string;
  scope: Record<string, Record<string, string[]>>;
  details?: string;
  referenceFiles?: ReferenceFile[];
  requestedAt: Timestamp;
  completedAt?: Timestamp;
  completedFileUrl?: string;
  completedStoragePath?: string;
  rejectReason?: string;
  unreadCountInstructor?: number;
  unreadCountAdmin?: number;
  assignedResearcher?: string;
}