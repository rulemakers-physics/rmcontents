// types/notice.ts
import { Timestamp } from "firebase/firestore";

export type NoticeCategory = "공지" | "업데이트" | "점검" | "이벤트";

export interface Notice {
  id: string;
  title: string;
  content: string; // 간단한 텍스트 또는 HTML
  category: NoticeCategory;
  isImportant: boolean; // 상단 고정 여부
  authorName: string;
  createdAt: Timestamp;
  views: number;
}