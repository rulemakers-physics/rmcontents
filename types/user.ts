// types/user.ts 혹은 existing types file

export type UserPlan = 'FREE' | 'BASIC' | 'MAKERS';

// 사업자 정보 타입
export interface BusinessInfo {
  companyName: string;      // 상호명 (법인/단체명)
  representative: string;   // 대표자명
  registrationNumber: string; // 사업자등록번호
  address: string;          // 사업장 주소
  taxEmail: string;         // 세금계산서 수신 이메일
  businessType?: string;    // 업태
  businessItem?: string;    // 종목
}

export interface UserData {
  uid: string;
  email: string | null;
  name: string;
  academy: string;
  role: 'admin' | 'instructor';
  school?: string; // [수정] 담당 학교 필드 추가 (선택 사항이므로 ? 붙임)
  // 구독 관련 필드 추가
  plan: UserPlan;
  subscriptionEndDate?: string; // ISO string
  coins: number; // 요청서 코인

  // 사업자 정보 필드 추가
  businessInfo?: BusinessInfo;
}