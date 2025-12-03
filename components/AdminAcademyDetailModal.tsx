// components/AdminAcademyDetailModal.tsx

"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { 
  XMarkIcon, UserIcon, UserGroupIcon, AcademicCapIcon, 
  MapPinIcon, PhoneIcon, ChartBarIcon 
} from "@heroicons/react/24/outline";
import { UserData } from "@/types/user";
import { ClassData, StudentData } from "@/types/academy";

interface Props {
  director: UserData;
  onClose: () => void;
}

export default function AdminAcademyDetailModal({ director, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<'overview' | 'instructors' | 'classes'>('overview');
  const [instructors, setInstructors] = useState<UserData[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // 학원 데이터 통합 로딩
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. 소속 강사 조회
        const qInst = query(collection(db, "users"), where("ownerId", "==", director.uid));
        const snapInst = await getDocs(qInst);
        const instList = snapInst.docs.map(d => d.data() as UserData);
        setInstructors(instList);

        // 2. 개설된 반 조회 (원장 소유)
        const qClass = query(collection(db, "classes"), where("ownerId", "==", director.uid), orderBy("createdAt", "desc"));
        const snapClass = await getDocs(qClass);
        const classList = snapClass.docs.map(d => ({ id: d.id, ...d.data() } as ClassData));
        setClasses(classList);

        // 3. 총 학생 수 집계
        const studentCount = classList.reduce((acc, cls) => acc + (cls.studentCount || 0), 0);
        setTotalStudents(studentCount);

      } catch (e) {
        console.error("데이터 로딩 실패", e);
      }
      setIsLoading(false);
    };
    fetchData();
  }, [director.uid]);

  // 강사 이름 찾기 헬퍼
  const getInstructorName = (uid: string) => {
    if (uid === director.uid) return `${director.name} (원장)`;
    const inst = instructors.find(i => i.uid === uid);
    return inst ? `${inst.name} T` : "알 수 없음";
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden">
        
        {/* 헤더 */}
        <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 uppercase">Director</span>
              <h2 className="text-2xl font-bold text-slate-900">{director.academy}</h2>
            </div>
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> 원장: {director.name} ({director.email})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab('overview')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'overview' ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            학원 개요
          </button>
          <button onClick={() => setActiveTab('instructors')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'instructors' ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            강사 관리 ({instructors.length})
          </button>
          <button onClick={() => setActiveTab('classes')} className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'classes' ? 'border-purple-600 text-purple-700 bg-purple-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            반/학생 현황 ({classes.length})
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-slate-400">데이터 분석 중...</div>
          ) : (
            <>
              {/* 1. 개요 탭 */}
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatBox label="총 학생 수" value={`${totalStudents}명`} icon={UserGroupIcon} color="text-blue-600" bg="bg-blue-50" />
                    <StatBox label="소속 강사" value={`${instructors.length}명`} icon={UserIcon} color="text-green-600" bg="bg-green-50" />
                    <StatBox label="운영 중인 반" value={`${classes.length}개`} icon={AcademicCapIcon} color="text-orange-600" bg="bg-orange-50" />
                  </div>

                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-slate-500" /> 학원 상세 정보
                    </h3>
                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <InfoRow label="대표자명" value={director.businessInfo?.representative || director.name} />
                      <InfoRow label="사업자번호" value={director.businessInfo?.registrationNumber || "-"} />
                      <InfoRow label="연락처" value={director.businessInfo?.taxEmail || director.email || "-"} />
                      <InfoRow label="주소" value={director.businessInfo?.address || "-"} />
                      <InfoRow label="구독 플랜" value={director.plan} badge />
                      <InfoRow label="보유 코인" value={`${director.coins}개`} />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. 강사 목록 탭 */}
              {activeTab === 'instructors' && (
                <div className="space-y-4">
                  {instructors.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border border-dashed rounded-xl">등록된 강사가 없습니다.</div>
                  ) : (
                    instructors.map((inst) => (
                      <div key={inst.uid} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold">
                            {inst.name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{inst.name}</p>
                            <p className="text-xs text-slate-500">{inst.email}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-slate-500">
                          가입일: {inst.createdAt ? new Date(inst.createdAt.seconds * 1000).toLocaleDateString() : "-"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 3. 반/학생 현황 탭 */}
              {activeTab === 'classes' && (
                <div className="space-y-4">
                  {classes.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 border border-dashed rounded-xl">개설된 반이 없습니다.</div>
                  ) : (
                    classes.map((cls) => (
                      <div key={cls.id} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-100">
                          <div>
                            <h4 className="font-bold text-slate-900">{cls.name}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">{cls.targetSchool || "학교 미지정"}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-slate-600">
                              <UserIcon className="w-4 h-4" /> {getInstructorName(cls.instructorId)}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-blue-600">
                              <UserGroupIcon className="w-4 h-4" /> {cls.studentCount}명
                            </span>
                          </div>
                        </div>
                        {/* 학생 목록은 필요 시 Drill-down으로 구현 가능 (여기선 생략) */}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon, color, bg }: any) {
  return (
    <div className="p-5 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
      <div className={`p-3 rounded-lg ${bg} ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase">{label}</p>
        <p className="text-xl font-extrabold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function InfoRow({ label, value, badge }: any) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-bold text-slate-400">{label}</span>
      {badge ? (
        <span className="inline-block self-start px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
          {value}
        </span>
      ) : (
        <span className="text-slate-800 font-medium">{value}</span>
      )}
    </div>
  );
}