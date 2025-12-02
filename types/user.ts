// types/user.ts
import { Timestamp } from "firebase/firestore";

export type UserPlan = 'FREE' | 'BASIC' | 'MAKERS';

// [신규] 사업자 정보 타입 (이전 대화에서 추가된 부분)
export interface BusinessInfo {
  companyName: string;      
  representative: string;   
  registrationNumber: string; 
  address: string;          
  taxEmail: string;         
  businessType?: string;    
  businessItem?: string;    
}

export interface UserData {
  uid: string;
  email: string | null;
  name: string;
  academy: string;
  role: 'admin' | 'instructor';
  school?: string;
  
  // 구독 관련
  plan: UserPlan;
  subscriptionEndDate?: string;
  coins: number;
  
  // [신규] 사업자 정보 (선택)
  businessInfo?: BusinessInfo;

  // [수정] 가입일 필드 추가 (Firestore Timestamp 또는 Date)
  createdAt?: Timestamp | Date | any; 
}