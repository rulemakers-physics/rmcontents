// components/AdminUserEditModal.tsx (수정됨)

"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { XMarkIcon, CheckIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { UserData, UserRole } from "@/types/user";

interface AdminUserEditModalProps {
  userData: UserData;
  onClose: (needsRefresh?: boolean) => void;
}

export default function AdminUserEditModal({ userData, onClose }: AdminUserEditModalProps) {
  const [name, setName] = useState(userData.name || "");
  const [academy, setAcademy] = useState(userData.academy || "");
  const [role, setRole] = useState<UserRole>(userData.role || 'instructor');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", userData.uid);
      await updateDoc(userRef, { name, academy, role });
      
      toast.success("회원 정보가 수정되었습니다.");
      onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("수정 실패");
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">회원 정보 수정</h3>
          <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">학원명</label>
            <input type="text" value={academy} onChange={(e) => setAcademy(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500">역할 (Role)</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white">
              <option value="instructor">강사 (Instructor)</option>
              <option value="director">원장 (Director)</option>
              <option value="admin">관리자 (Admin)</option>
            </select>
          </div>
          
          <div className="pt-2">
            <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 border border-slate-100">
              <p>Email: {userData.email}</p>
              <p>UID: {userData.uid}</p>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
          <button onClick={() => onClose()} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg">
            취소
          </button>
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md">
            {isSaving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}