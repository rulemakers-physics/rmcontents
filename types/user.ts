// types/user.ts
import { Timestamp } from "firebase/firestore";

export type UserRole = 'admin' | 'director' | 'instructor';
export type UserPlan = 'FREE' | 'BASIC' | 'MAKERS';

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

  // 개인용
  personalIdNumber?: string; // [신규] 주민등록번호 (보안 주의)

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
  plan: UserPlan;
  coins: number;
  
  businessInfo?: BusinessInfo; // [수정된 타입 적용]

  createdAt?: Timestamp | Date | any; 
}