// app/(app)/admin/users/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  where, 
  Timestamp 
} from "firebase/firestore";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  UserCircleIcon,
  PencilSquareIcon,
  CreditCardIcon,
  CurrencyDollarIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import AdminUserEditModal from "@/components/AdminUserEditModal";
import { UserData } from "@/types/user";

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 검색 및 필터
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL"); // ALL, BASIC, MAKERS, FREE

  // 모달
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      let q = query(usersRef, orderBy("createdAt", "desc"));

      // *Firestore 쿼리 제약상 복합 필터는 인덱스가 필요하므로, 
      // 여기서는 전체를 가져와서 클라이언트 사이드에서 필터링하는 방식을 택합니다.
      // (유저 수가 수천 명이 넘어가면 Algolia 도입이나 페이지네이션 필수)
      
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserData));

      setUsers(list);
    } catch (error) {
      console.error("유저 로딩 실패:", error);
      toast.error("데이터를 불러오지 못했습니다.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (user?.isAdmin) {
      fetchUsers();
    }
  }, [user]);

  // 클라이언트 필터링
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (u.academy?.toLowerCase() || "").includes(searchTerm.toLowerCase());
    
    const matchesPlan = planFilter === "ALL" || u.plan === planFilter;

    return matchesSearch && matchesPlan;
  });

  const handleEdit = (targetUser: UserData) => {
    setSelectedUser(targetUser);
    setIsModalOpen(true);
  };

  const handleModalClose = (needsRefresh = false) => {
    setIsModalOpen(false);
    setSelectedUser(null);
    if (needsRefresh) fetchUsers();
  };

  if (loading || !user?.isAdmin) return <div className="p-8 text-center">접근 권한 확인 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">회원 관리 (CRM)</h1>
            <p className="text-slate-500 text-sm mt-1">
              총 <span className="font-bold text-blue-600">{filteredUsers.length}</span>명의 회원이 조회되었습니다.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 이메일, 학원 검색" 
                className="pl-10 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="relative">
              <select 
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="appearance-none pl-10 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">전체 플랜</option>
                <option value="MAKERS">Maker's Plan</option>
                <option value="BASIC">Basic Plan</option>
                <option value="FREE">Free Plan</option>
              </select>
              <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* 유저 리스트 테이블 */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">회원 정보</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">학원/학교</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">플랜 / 코인</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">가입일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <UserCircleIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{u.name}</p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{u.academy}</p>
                      <p className="text-xs text-slate-400">{u.school || "-"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <CreditCardIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            u.plan === 'MAKERS' ? 'bg-indigo-100 text-indigo-700' :
                            u.plan === 'BASIC' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {u.plan}
                          </span>
                        </div>
                        {u.plan === 'MAKERS' && (
                          <div className="flex items-center gap-1.5 text-xs text-yellow-600 font-medium ml-0.5">
                            <CurrencyDollarIcon className="w-3.5 h-3.5" />
                            Coin: {u.coins}개
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {/* createdAt이 Timestamp일 수도 있고 Date일 수도 있음 체크 */}
                      {u.createdAt ? (u.createdAt as any).toDate?.().toLocaleDateString() || new Date(u.createdAt as any).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleEdit(u)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="정보 수정"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      검색된 회원이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 수정 모달 */}
        {isModalOpen && selectedUser && (
          <AdminUserEditModal 
            userData={selectedUser} 
            onClose={handleModalClose} 
          />
        )}

      </div>
    </div>
  );
}