// types/user.ts
import { Timestamp } from "firebase/firestore";

// [수정] 'student' 역할 추가
export type UserRole = 'admin' | 'director' | 'instructor' | 'student';
export type UserPlan = 
  | 'FREE' 
  | 'BASIC' 
  | 'MAKERS' 
  // [신규] 학생용 플랜 추가
  | 'STD_STANDARD'  // 내신 한 달 Plan
  | 'STD_PREMIUM';  // 통합과학 연간 Plan

// [수정] 세금 정보 타입 고도화
export interface BusinessInfo {
  taxType: 'business' | 'personal'; // [신규] 유형 구분
  
  // 공통
  representative: string;   // 대표자명 (개인은 성명)
  address: string;          // 주소
  taxEmail: string;         // 계산서 수신 이메일
  
  // 사업자용
  companyName?: string;      // 상호명
  registrationNumber?: string; // 사업자등록번호
  businessType?: string;    // 업태
  businessItem?: string;    // 종목
  licenseFileUrl?: string;  // [신규] 사업자등록증 파일 경로
  licenseFileName?: string; // [신규] 파일명

  // 개인용 현금영수증 번호(휴대폰)
  cashReceiptNumber?: string;

  // [신규] 검수 상태 (없음, 대기중, 승인됨, 반려됨)
  verificationStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string; // 반려 사유
}

export interface UserData {
  uid: string;
  email: string | null;
  name: string;
  academy: string;
  role: UserRole;
  school?: string;
  ownerId?: string;
  // 학생 전용 필드 (추가됨)
  grade?: number;       // 학년
  targetUnit?: string;  // 집중 학습 단원
  parentPhone?: string; // 부모님 연락처
  // [수정] 플랜 및 결제 관련 필드
  plan: UserPlan;
  coins: number;
  
  // [신규] 무료 체험 및 구독 상태 관리를 위한 필드
  trialStartDate?: Timestamp | null;
  billingKey?: string;        // 카드 등록 여부 확인용 (존재하면 카드 등록됨)
  // [수정] 결제 실패 및 해지 예약 상태 추가
  subscriptionStatus?: 'NONE' | 'TRIAL' | 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PAYMENT_FAILED' | 'SCHEDULED_CANCEL';
  // [🌟 추가됨] 결제 실패 사유 (빌드 에러 해결)
  lastPaymentFailReason?: string;
  nextPaymentDate?: Timestamp; // 다음 결제 예정일

  businessInfo?: BusinessInfo; 
  createdAt?: Timestamp | Date | any; 
}