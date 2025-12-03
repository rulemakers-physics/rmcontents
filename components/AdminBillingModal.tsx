// components/AdminBillingModal.tsx

"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  XMarkIcon, CheckCircleIcon, XCircleIcon, 
  CreditCardIcon, DocumentTextIcon, CurrencyDollarIcon 
} from "@heroicons/react/24/outline";
import { UserData, UserPlan } from "@/types/user";

interface AdminBillingModalProps {
  userData: UserData;
  onClose: (needsRefresh?: boolean) => void;
}

export default function AdminBillingModal({ userData, onClose }: AdminBillingModalProps) {
  const [plan, setPlan] = useState<UserPlan>(userData.plan || 'FREE');
  const [coins, setCoins] = useState(userData.coins || 0);
  
  // 사업자 검수 상태
  const bizInfo = userData.businessInfo;
  const [verifyStatus, setVerifyStatus] = useState(bizInfo?.verificationStatus || 'none');
  const [rejectReason, setRejectReason] = useState(bizInfo?.rejectionReason || "");

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", userData.uid);
      
      // 업데이트 데이터 구성
      const updates: any = {
        plan,
        coins: Number(coins),
        "businessInfo.verificationStatus": verifyStatus,
      };

      if (verifyStatus === 'rejected') {
        updates["businessInfo.rejectionReason"] = rejectReason;
      }

      await updateDoc(userRef, updates);
      
      toast.success("결제/세금 정보가 업데이트되었습니다.");
      onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("업데이트 실패");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-emerald-50">
          <div className="flex items-center gap-2 text-emerald-800">
            <BanknotesIcon className="w-6 h-6" />
            <h3 className="text-xl font-bold">결제 및 세금 관리</h3>
          </div>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* 1. 구독 플랜 & 코인 관리 */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CreditCardIcon className="w-4 h-4" /> 구독 및 재화 설정
            </h4>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">현재 플랜</label>
                <select 
                  value={plan} 
                  onChange={(e) => setPlan(e.target.value as UserPlan)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="FREE">Free Plan</option>
                  <option value="BASIC">Basic Plan</option>
                  <option value="MAKERS">Maker's Plan</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">보유 코인</label>
                <div className="relative">
                  <CurrencyDollarIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="number" 
                    value={coins} 
                    onChange={(e) => setCoins(Number(e.target.value))}
                    className="w-full pl-8 p-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* 2. 사업자 정보 검수 */}
          <section>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4" /> 사업자 정보 및 증빙 검수
            </h4>
            
            {bizInfo ? (
              <div className={`p-4 rounded-xl border ${
                verifyStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'
              }`}>
                {/* 정보 요약 */}
                <div className="text-sm space-y-1 mb-4 text-slate-600">
                  <p><span className="font-bold">유형:</span> {bizInfo.taxType === 'business' ? '사업자' : '개인'}</p>
                  <p><span className="font-bold">상호/성명:</span> {bizInfo.companyName || bizInfo.representative}</p>
                  <p><span className="font-bold">등록번호:</span> {bizInfo.registrationNumber || bizInfo.personalIdNumber}</p>
                  
                  {/* 파일 다운로드 */}
                  {bizInfo.licenseFileUrl ? (
                    <a 
                      href={bizInfo.licenseFileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold mt-2 bg-blue-50 px-3 py-1.5 rounded-lg text-xs"
                    >
                      📄 증빙 서류 확인하기
                    </a>
                  ) : (
                    <p className="text-red-400 text-xs mt-2 font-bold">※ 증빙 파일 미첨부</p>
                  )}
                </div>

                {/* 승인/반려 컨트롤 */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setVerifyStatus('verified')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        verifyStatus === 'verified' 
                          ? 'bg-emerald-600 text-white border-emerald-600' 
                          : 'bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircleIcon className="w-4 h-4 inline mr-1" /> 승인
                    </button>
                    <button
                      onClick={() => setVerifyStatus('rejected')}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${
                        verifyStatus === 'rejected' 
                          ? 'bg-red-600 text-white border-red-600' 
                          : 'bg-white text-red-600 border-red-200 hover:bg-red-50'
                      }`}
                    >
                      <XCircleIcon className="w-4 h-4 inline mr-1" /> 반려
                    </button>
                  </div>
                  
                  {/* 반려 사유 입력 (반려 선택 시에만 노출) */}
                  {verifyStatus === 'rejected' && (
                    <input 
                      type="text" 
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="반려 사유를 입력하세요 (예: 식별 불가)"
                      className="w-full p-2 border border-red-200 rounded-lg text-xs text-red-700 focus:ring-1 focus:ring-red-500 outline-none"
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 text-sm">
                입력된 세금 정보가 없습니다.
              </div>
            )}
          </section>

        </div>

        {/* 푸터 */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button onClick={() => onClose()} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg">
            취소
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 shadow-md disabled:opacity-50"
          >
            {isSaving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

// 아이콘 임포트 보완 (BanknotesIcon이 없으면 Heroicons에서 추가 필요)
import { BanknotesIcon } from "@heroicons/react/24/outline";