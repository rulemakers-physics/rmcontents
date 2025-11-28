// types/user.ts 혹은 existing types file

export type UserPlan = 'FREE' | 'BASIC' | 'MAKERS';

export interface UserData {
  uid: string;
  email: string | null;
  name: string;
  academy: string;
  role: 'admin' | 'instructor';
  school?: string; // [수정] 담당 학교 필드 추가 (선택 사항이므로 ? 붙임)
  // ▼ 구독 관련 필드 추가
  plan: UserPlan;
  subscriptionEndDate?: string; // ISO string
  coins: number; // 요청서 코인
}