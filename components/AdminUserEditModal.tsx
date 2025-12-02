// components/AdminUserEditModal.tsx

"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { XMarkIcon, CheckIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { UserData, UserPlan } from "@/types/user";

interface AdminUserEditModalProps {
  userData: UserData;
  onClose: (needsRefresh?: boolean) => void;
}

export default function AdminUserEditModal({ userData, onClose }: AdminUserEditModalProps) {
  const [plan, setPlan] = useState<UserPlan>(userData.plan);
  const [coins, setCoins] = useState(userData.coins || 0);
  const [name, setName] = useState(userData.name || "");
  const [academy, setAcademy] = useState(userData.academy || "");
  const [role, setRole] = useState(userData.role);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, {
        name,
        academy,
        plan,
        coins: Number(coins),
        role
      });
      
      toast.success(`${name}님의 정보가 수정되었습니다.`);
      onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("수정 실패");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        {/* 헤더 */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h3 className="text-xl font-bold text-slate-900">회원 정보 수정 (Admin)</h3>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 바디 */}
        <div className="p-6 space-y-6">
          
          {/* 1. 기본 정보 */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">기본 정보</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">이름</label>
                <input 
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">학원명</label>
                <input 
                  type="text" value={academy} onChange={(e) => setAcademy(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">이메일 (수정 불가)</label>
              <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500">
                {userData.email}
              </div>
            </div>
          </div>

          {/* 2. 관리자 권한 설정 (위험 구역) */}
          <div className="p-4 bg-red-50 rounded-xl border border-red-100">
            <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <ShieldExclamationIcon className="w-4 h-4" /> 권한 및 구독 관리
            </h4>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">플랜 (Plan)</label>
                  <select 
                    value={plan} 
                    onChange={(e) => setPlan(e.target.value as UserPlan)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FREE">FREE</option>
                    <option value="BASIC">BASIC</option>
                    <option value="MAKERS">MAKERS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">요청 코인 (Coins)</label>
                  <input 
                    type="number" value={coins} onChange={(e) => setCoins(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">계정 권한 (Role)</label>
                <select 
                  value={role} 
                  onChange={(e) => setRole(e.target.value as 'admin' | 'instructor')}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="instructor">일반 강사 (Instructor)</option>
                  <option value="admin">관리자 (Admin)</option>
                </select>
                <p className="text-[10px] text-red-500 mt-1">
                  * 관리자로 설정하면 대시보드의 모든 데이터에 접근할 수 있습니다. 주의하세요.
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            onClick={() => onClose()}
            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
          >
            취소
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50"
          >
            <CheckIcon className="w-4 h-4" /> {isSaving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>

      </div>
    </div>
  );
}