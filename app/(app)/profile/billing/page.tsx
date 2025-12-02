// app/(app)/profile/billing/page.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { 
  CreditCardIcon, 
  DocumentTextIcon, 
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";

export default function BillingPage() {
  const { user, userData, loading } = useAuth();
  
  // 폼 상태
  const [companyName, setCompanyName] = useState("");
  const [representative, setRepresentative] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [address, setAddress] = useState("");
  const [taxEmail, setTaxEmail] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessItem, setBusinessItem] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    if (userData?.businessInfo) {
      const { companyName, representative, registrationNumber, address, taxEmail, businessType, businessItem } = userData.businessInfo;
      setCompanyName(companyName || "");
      setRepresentative(representative || "");
      setRegistrationNumber(registrationNumber || "");
      setAddress(address || "");
      setTaxEmail(taxEmail || "");
      setBusinessType(businessType || "");
      setBusinessItem(businessItem || "");
    }
  }, [userData]);

  // 저장 핸들러
  const handleSaveBusinessInfo = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        businessInfo: {
          companyName,
          representative,
          registrationNumber,
          address,
          taxEmail,
          businessType,
          businessItem
        }
      });
      toast.success("세금계산서 정보가 저장되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("저장에 실패했습니다.");
    }
    setIsSaving(false);
  };

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">결제 및 세금계산서 관리</h1>
          <p className="text-slate-500 mt-1">구독 상태를 확인하고 세금계산서 발행 정보를 관리하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 왼쪽: 구독 정보 & 결제 내역 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 현재 구독 플랜 */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCardIcon className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Plan</h3>
            <div className="text-3xl font-extrabold mb-4">{userData?.plan || 'FREE'} Plan</div>
            
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>현재 이용 중인 서비스입니다.</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-400" />
                <span>다음 결제일: 2025. 11. 01</span>
              </div>
            </div>
            
            <button className="mt-6 w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
              플랜 업그레이드 / 변경
            </button>
          </div>

          {/* 결제 내역 (Mockup) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-slate-500" /> 결제 내역
            </h3>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-bold text-slate-800">2025. 10. 01</p>
                    <p className="text-xs text-slate-500">Basic Plan (1개월)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">99,000원</p>
                    <button className="text-xs text-blue-600 hover:underline">영수증 출력</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 세금계산서 정보 입력 폼 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BuildingLibraryIcon className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800">세금계산서 발행 정보</h3>
              </div>
              <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                매월 10일 자동 발행
              </span>
            </div>
            
            <form onSubmit={handleSaveBusinessInfo} className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">상호명 (법인/단체명) <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="사업자등록증상의 상호명"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">대표자명 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={representative} 
                    onChange={(e) => setRepresentative(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="대표자 성함"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">사업자등록번호 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={registrationNumber} 
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="000-00-00000"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">계산서 수신 이메일 <span className="text-red-500">*</span></label>
                  <input 
                    type="email" 
                    value={taxEmail} 
                    onChange={(e) => setTaxEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="example@academy.com"
                    required 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-bold text-slate-700">사업장 주소 <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="사업자등록증상의 주소지"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">업태 (선택)</label>
                  <input 
                    type="text" 
                    value={businessType} 
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="예: 교육서비스업"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">종목 (선택)</label>
                  <input 
                    type="text" 
                    value={businessItem} 
                    onChange={(e) => setBusinessItem(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                    placeholder="예: 입시학원"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? "저장 중..." : "정보 저장하기"}
                </button>
              </div>
            </form>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 leading-relaxed">
            * 입력하신 정보는 세금계산서 발행 목적으로만 사용됩니다.<br/>
            * 매월 결제일 기준 10일 이내에 입력하신 이메일로 전자세금계산서가 발송됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}