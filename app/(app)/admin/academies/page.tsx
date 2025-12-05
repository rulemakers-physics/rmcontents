// app/(app)/admin/academies/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { 
  BuildingOffice2Icon, MagnifyingGlassIcon, UserIcon, MapPinIcon 
} from "@heroicons/react/24/outline";
import { UserData } from "@/types/user";
import AdminAcademyDetailModal from "@/components/AdminAcademyDetailModal";

export default function AdminAcademiesPage() {
  const { user, loading } = useAuth();
  const [academies, setAcademies] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // 모달 상태
  const [selectedAcademy, setSelectedAcademy] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchAcademies = async () => {
      if (!user?.isAdmin) return;
      setIsLoading(true);
      try {
        // role이 'director'인 유저만 조회 (이들이 곧 학원임)
        const q = query(
          collection(db, "users"),
          where("role", "==", "director"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        setAcademies(snapshot.docs.map(doc => doc.data() as UserData));
      } catch (e) {
        console.error(e);
      }
      setIsLoading(false);
    };
    fetchAcademies();
  }, [user]);

  const filtered = academies.filter(a => 
    a.academy.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading || !user?.isAdmin) return <div className="p-10 text-center">권한 확인 중...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-full">
      <div className="max-w-7xl mx-auto">
        
        {/* 헤더 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BuildingOffice2Icon className="w-8 h-8 text-blue-600" />
              학원 현황 관리
            </h1>
            <p className="text-slate-500 mt-1">계약된 학원(원장) 목록과 운영 현황을 조회합니다.</p>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="학원명, 원장명 검색" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full sm:w-72 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 학원 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((academy) => (
            <div 
              key={academy.uid} 
              onClick={() => setSelectedAcademy(academy)}
              className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <BuildingOffice2Icon className="w-24 h-24 text-purple-600" />
              </div>

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <BuildingOffice2Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold border ${
                    academy.plan === 'MAKERS' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {academy.plan || "FREE"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{academy.academy}</h3>
                
                <div className="space-y-2 mt-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    <span>{academy.name} 원장</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{academy.businessInfo?.address || "주소 미입력"}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                  <span>가입: {academy.createdAt ? new Date(academy.createdAt.seconds * 1000).toLocaleDateString() : "-"}</span>
                  <span className="text-purple-600 group-hover:underline">상세 보기 →</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <p className="text-slate-500">등록된 학원이 없습니다.</p>
          </div>
        )}
      </div>

      {/* 상세 모달 */}
      {selectedAcademy && (
        <AdminAcademyDetailModal 
          director={selectedAcademy} 
          onClose={() => setSelectedAcademy(null)} 
        />
      )}
    </div>
  );
}