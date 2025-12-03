// app/(app)/admin/billing/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { 
  BanknotesIcon, FunnelIcon, MagnifyingGlassIcon, 
  CheckBadgeIcon, ExclamationCircleIcon 
} from "@heroicons/react/24/outline";
import { UserData } from "@/types/user";
import AdminBillingModal from "@/components/AdminBillingModal";

export default function AdminBillingPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 필터
  const [filterType, setFilterType] = useState<'all' | 'pending' | 'makers'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  // 모달
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => doc.data() as UserData));
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.isAdmin) fetchUsers();
  }, [user]);

  const filteredUsers = users.filter(u => {
    // 1. 검색어 필터
    const matchSearch = 
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
      (u.academy?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    // 2. 상태 필터
    let matchFilter = true;
    if (filterType === 'pending') {
      matchFilter = u.businessInfo?.verificationStatus === 'pending';
    } else if (filterType === 'makers') {
      matchFilter = u.plan === 'MAKERS';
    }

    return matchSearch && matchFilter;
  });

  if (loading || !user?.isAdmin) return <div className="p-8 text-center">권한 확인 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 & 필터 */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BanknotesIcon className="w-8 h-8 text-emerald-600" />
              결제 및 세금 관리
            </h1>
            <p className="text-slate-500 mt-1">구독 현황을 모니터링하고 증빙 서류를 검수합니다.</p>
          </div>

          <div className="flex gap-3">
            {/* 빠른 필터 버튼 */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'all' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                전체
              </button>
              <button 
                onClick={() => setFilterType('pending')}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'text-slate-400 hover:text-yellow-600'}`}
              >
                <ExclamationCircleIcon className="w-3.5 h-3.5" /> 검수 대기
              </button>
              <button 
                onClick={() => setFilterType('makers')}
                className={`flex items-center gap-1 px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterType === 'makers' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400 hover:text-indigo-600'}`}
              >
                <CheckBadgeIcon className="w-3.5 h-3.5" /> Maker's
              </button>
            </div>

            {/* 검색창 */}
            <div className="relative">
              <input 
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 학원명 검색"
                className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-48"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-emerald-50/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">회원 정보</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">현재 플랜 / 코인</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">증빙 정보 / 검수 상태</th>
                <th className="px-6 py-3 text-right text-xs font-bold text-slate-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => (
                <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.academy}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${
                        u.plan === 'MAKERS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                        u.plan === 'BASIC' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {u.plan || 'FREE'}
                      </span>
                      {u.plan === 'MAKERS' && (
                        <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-1.5 rounded border border-yellow-200">
                          {u.coins} C
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {u.businessInfo ? (
                      <div className="flex items-center gap-2">
                        {/* 검수 상태 배지 */}
                        {u.businessInfo.verificationStatus === 'pending' && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-bold animate-pulse">
                            <ExclamationCircleIcon className="w-3 h-3" /> 검수 필요
                          </span>
                        )}
                        {u.businessInfo.verificationStatus === 'verified' && (
                          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">인증됨</span>
                        )}
                        {u.businessInfo.verificationStatus === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">반려됨</span>
                        )}
                        
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">
                          {u.businessInfo.companyName || u.businessInfo.representative}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedUser(u)}
                      className="text-xs font-bold text-slate-500 hover:text-emerald-600 border border-slate-200 hover:border-emerald-300 px-3 py-1.5 rounded-lg transition-colors bg-white"
                    >
                      관리
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">조건에 맞는 회원이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <AdminBillingModal 
          userData={selectedUser} 
          onClose={(refresh) => {
            setSelectedUser(null);
            if (refresh) fetchUsers();
          }} 
        />
      )}
    </div>
  );
}