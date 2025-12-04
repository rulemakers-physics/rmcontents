// app/(app)/admin/users/page.tsx

"use client";

import { useEffect, useState, useMemo, useCallback } from "react"; // [수정] useCallback 추가
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, orderBy, getDocs 
} from "firebase/firestore";
import { 
  MagnifyingGlassIcon, FunnelIcon, UserCircleIcon,
  PencilSquareIcon, CreditCardIcon, CurrencyDollarIcon,
  ListBulletIcon, BuildingOfficeIcon
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import AdminUserEditModal from "@/components/AdminUserEditModal";
import { UserData } from "@/types/user";

// 학원 그룹핑을 위한 인터페이스
interface AcademyGroup {
  director: UserData;
  instructors: UserData[];
}

export default function AdminUsersPage() {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 상태 관리
  // 기본값을 'list'로 하여 전체 현황을 먼저 보게 함
  const [viewMode, setViewMode] = useState<'list' | 'group'>('list'); 
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("ALL");
  
  // 모달 상태
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 그룹 확장 상태 (Set에 director uid 저장)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // [수정] fetchUsers 함수를 useCallback으로 감싸서 안정화
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("createdAt", "desc"));
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
  }, []); // 의존성 없음 (외부 변수인 db 등은 안정적임)

  // [수정] 의존성 배열에 fetchUsers 추가 (이제 안전함)
  useEffect(() => {
    if (user?.isAdmin) fetchUsers();
  }, [user, fetchUsers]);

  // --- [로직] 필터링 및 그룹핑 ---
  
  // 1. 단일 유저 필터링 함수 [수정됨: useCallback 적용]
  const matchUser = useCallback((u: UserData) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (u.name?.toLowerCase() || "").includes(searchLower) ||
      (u.email?.toLowerCase() || "").includes(searchLower) ||
      (u.academy?.toLowerCase() || "").includes(searchLower) ||
      (u.school?.toLowerCase() || "").includes(searchLower); 
    
    const userPlan = u.plan || 'FREE'; 
    const matchesPlan = planFilter === "ALL" || userPlan === planFilter;

    return matchesSearch && matchesPlan;
  }, [searchTerm, planFilter]); // searchTerm이나 planFilter가 바뀔 때만 함수 재생성

  // 2. 데이터 가공 (메모이제이션) [수정됨: 의존성 배열 변경]
  const { filteredList, groupedData, others } = useMemo(() => {
    // A. 리스트 뷰용 단순 필터링
    const filteredList = users.filter(matchUser);

    // B. 그룹 뷰용 데이터 구조화
    const groups: AcademyGroup[] = [];
    const directorMap = new Map<string, AcademyGroup>();
    const otherUsers: UserData[] = [];

    // Step 1: 원장(Director) 찾아서 그룹 생성
    users.forEach(u => {
      if (u.role === 'director') {
        const group: AcademyGroup = { director: u, instructors: [] };
        directorMap.set(u.uid, group);
        groups.push(group);
      }
    });

    // Step 2: 강사(Instructor) 및 기타 유저 분류
    users.forEach(u => {
      if (u.role === 'director') return; 

      if (u.role === 'instructor' && u.ownerId && directorMap.has(u.ownerId)) {
        directorMap.get(u.ownerId)!.instructors.push(u);
      } else {
        otherUsers.push(u);
      }
    });

    // Step 3: 그룹 필터링
    const filteredGroups = groups.filter(group => {
      const directorMatches = matchUser(group.director);
      const hasMatchingInstructor = group.instructors.some(inst => matchUser(inst));
      
      // 검색어가 있거나 필터가 있을 때는 매칭되는 항목이 있는 그룹만 표시
      // (matchUser 내부에 이미 searchTerm, planFilter 로직이 있으므로 여기선 결과만 확인해도 됨)
      // 하지만 원본 로직 유지를 위해 조건문 유지
      if (searchTerm || planFilter !== "ALL") {
        return directorMatches || hasMatchingInstructor;
      }
      return true;
    });

    // Step 4: 기타 유저 필터링
    const filteredOthers = otherUsers.filter(matchUser);

    return { filteredList, groupedData: filteredGroups, others: filteredOthers };
  }, [users, matchUser]); // [수정됨] users와 matchUser가 변경될 때만 재계산


  // --- 핸들러 ---
  const handleEdit = (targetUser: UserData) => {
    setSelectedUser(targetUser);
    setIsModalOpen(true);
  };

  const handleModalClose = (needsRefresh = false) => {
    setIsModalOpen(false);
    setSelectedUser(null);
    if (needsRefresh) fetchUsers();
  };

  const toggleGroup = (directorId: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(directorId)) {
      newSet.delete(directorId);
    } else {
      newSet.add(directorId);
    }
    setExpandedGroups(newSet);
  };

  // 날짜 포맷팅 헬퍼 (Timestamp 호환)
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "-";
    // Firestore Timestamp인 경우
    if (dateValue.toDate) return dateValue.toDate().toLocaleDateString();
    // JS Date 객체이거나 문자열인 경우
    return new Date(dateValue).toLocaleDateString();
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
              총 <span className="font-bold text-blue-600">{users.length}</span>명의 회원 
              (학원: {groupedData.length}개 / 기타: {others.length}명)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* 뷰 모드 토글 */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'list' ? 'bg-slate-100 text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ListBulletIcon className="w-4 h-4" /> 전체 리스트
              </button>
              <button 
                onClick={() => setViewMode('group')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${viewMode === 'group' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BuildingOfficeIcon className="w-4 h-4" /> 학원별 보기
              </button>
            </div>

            {/* 필터 */}
            <div className="relative">
              <select 
                value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}
                className="appearance-none pl-9 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm cursor-pointer"
              >
                <option value="ALL">전체 플랜</option>
                <option value="MAKERS">Maker's</option>
                <option value="BASIC">Basic</option>
                <option value="STD_PREMIUM">학생(연간)</option>
                <option value="STD_STANDARD">학생(월간)</option>
                <option value="FREE">Free</option>
              </select>
              <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            {/* 검색 */}
            <div className="relative">
              <input 
                type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="이름, 이메일, 학교/학원 검색" 
                className="pl-9 pr-4 py-2.5 w-full sm:w-64 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
              />
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* --- [뷰 1] 학원별 그룹 보기 --- */}
        {viewMode === 'group' && (
          <div className="space-y-6">
            
            {/* 학원 그룹 리스트 */}
            <div className="space-y-4">
              {groupedData.map((group) => {
                const isExpanded = expandedGroups.has(group.director.uid);
                const hasInstructors = group.instructors.length > 0;

                return (
                  <div key={group.director.uid} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all">
                    {/* 원장(학원) 헤더 Row */}
                    <div 
                      onClick={() => toggleGroup(group.director.uid)}
                      className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-slate-50 border-b border-slate-100' : ''}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                          <BuildingOfficeIcon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-lg">{group.director.academy}</h3>
                            <span className="text-xs px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold">Director</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-500 mt-0.5">
                            <span>{group.director.name} 원장</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span>{group.director.email}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className={`font-bold ${group.director.plan === 'MAKERS' ? 'text-indigo-600' : 'text-slate-600'}`}>
                              {group.director.plan || 'FREE'} Plan
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="block text-xs text-slate-400 font-bold uppercase">소속 강사</span>
                          <span className="text-lg font-bold text-slate-700">{group.instructors.length}명</span>
                        </div>
                        {/* 더보기 아이콘 */}
                        <div className={`p-2 rounded-full transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-slate-200' : 'hover:bg-slate-100'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* 소속 강사 리스트 (Accordion Body) */}
                    {isExpanded && (
                      <div className="bg-slate-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                        {hasInstructors ? (
                          <table className="w-full text-sm text-left">
                            <thead className="text-slate-400 font-medium border-b border-slate-200">
                              <tr>
                                <th className="pb-2 pl-4">강사명</th>
                                <th className="pb-2">이메일</th>
                                <th className="pb-2">플랜</th>
                                <th className="pb-2">가입일</th>
                                <th className="pb-2 text-right pr-4">관리</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {group.instructors.map((inst) => (
                                <tr key={inst.uid} className="hover:bg-blue-50/50 transition-colors">
                                  <td className="py-3 pl-4 font-medium text-slate-700 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                    {inst.name}
                                  </td>
                                  <td className="py-3 text-slate-500">{inst.email}</td>
                                  <td className="py-3">
                                    <span className={`text-xs px-2 py-0.5 rounded border ${
                                      inst.plan === 'MAKERS' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 
                                      'bg-white border-slate-200 text-slate-500'
                                    }`}>
                                      {inst.plan || 'FREE'}
                                    </span>
                                  </td>
                                  <td className="py-3 text-slate-400 text-xs">
                                    {formatDate(inst.createdAt)}
                                  </td>
                                  <td className="py-3 text-right pr-4">
                                    <button 
                                      onClick={() => handleEdit(inst)}
                                      className="text-xs font-bold text-slate-400 hover:text-blue-600 underline"
                                    >
                                      수정
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="text-center py-4 text-slate-400 text-sm italic">
                            등록된 소속 강사가 없습니다.
                          </div>
                        )}
                        
                        {/* 원장 정보 수정 버튼 (하단 배치) */}
                        <div className="mt-4 pt-3 border-t border-slate-200 flex justify-end">
                          <button 
                            onClick={() => handleEdit(group.director)}
                            className="text-xs font-bold px-3 py-1.5 bg-white border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                          >
                            원장 정보 수정
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 기타 회원 (학생 포함) 섹션 */}
            {others.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">
                  기타 회원 (학생 / 관리자 / 프리랜서)
                </h3>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">회원 정보</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">역할 / 소속</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">플랜</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500">관리</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {others.map((u) => (
                        <tr key={u.uid} className="hover:bg-slate-50">
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <UserCircleIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900">{u.name}</p>
                                <p className="text-xs text-slate-500">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex flex-col gap-1">
                              <div>
                                {u.role === 'admin' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Admin</span>}
                                {u.role === 'student' && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">학생</span>}
                                {(!u.role || u.role === 'instructor') && <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">Instructor (Free)</span>}
                              </div>
                              <p className="text-xs text-slate-500">
                                {u.role === 'student' ? u.school || "학교 미입력" : u.academy || "소속 없음"}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600">
                            {u.plan || 'FREE'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button onClick={() => handleEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded">
                              <PencilSquareIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- [뷰 2] 전체 리스트 보기 (학생 포함) --- */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">회원 정보</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">역할 / 소속</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">플랜 / 코인</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">가입일</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredList.map((u) => (
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
                        <div className="flex flex-col gap-1">
                          <div>
                            {u.role === 'admin' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">Admin</span>}
                            {u.role === 'director' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700">원장</span>}
                            {u.role === 'instructor' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">강사</span>}
                            {/* 학생 뱃지 추가 */}
                            {u.role === 'student' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">학생</span>}
                          </div>
                          {/* 학생이면 학교, 아니면 학원 */}
                          <p className="text-sm text-slate-700">
                            {u.role === 'student' ? u.school || "-" : u.academy || "-"}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <CreditCardIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              u.plan === 'MAKERS' ? 'bg-indigo-100 text-indigo-700' :
                              u.plan?.startsWith('STD') ? 'bg-emerald-100 text-emerald-700' : // 학생용 플랜 색상
                              u.plan === 'BASIC' ? 'bg-blue-100 text-blue-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {u.plan || 'FREE'}
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
                        {formatDate(u.createdAt)}
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
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 회원 정보 수정 모달 */}
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