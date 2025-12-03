// app/(app)/manage/instructors/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, setDoc, doc, deleteDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  UserPlusIcon, TrashIcon, IdentificationIcon, EnvelopeIcon 
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { UserData } from "@/types/user";

export default function InstructorManagePage() {
  const { user, userData } = useAuth();
  const [instructors, setInstructors] = useState<UserData[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // 강사 목록 불러오기
  const fetchInstructors = async () => {
    if (!user) return;
    const q = query(
      collection(db, "users"),
      where("ownerId", "==", user.uid) // 내가 등록한 강사만 조회
    );
    const snap = await getDocs(q);
    setInstructors(snap.docs.map(d => d.data() as UserData));
  };

  useEffect(() => {
    fetchInstructors();
  }, [user]);

  // 강사 초대(등록) 핸들러
  const handleInvite = async () => {
    if (!newEmail || !newName) return toast.error("이름과 이메일을 입력해주세요.");
    if (!userData) return;

    setIsAdding(true);
    try {
      // 이메일을 ID로 쓰거나, 별도 로직이 필요하지만 간편하게 이메일 기반 가상 UID 생성 등 처리
      // 여기서는 편의상 email을 문서 ID처럼 활용하거나 랜덤 ID 생성 후 email 필드 저장
      // *실제로는*: Firebase Auth와 연동되므로, 강사가 로그인 시 매칭되게 하려면 
      // 'invited_users' 컬렉션을 쓰거나, 미리 users에 email로 문서를 만들어두는 전략 사용.
      
      // [전략] 'users' 컬렉션에 이메일로 쿼리할 수 있게 미리 문서를 생성해둠.
      // 단, uid를 모르므로 임시 ID로 생성하고, 강사가 로그인 시 이메일 매칭 후 업데이트하는 로직이 필요함.
      // (간편 구현을 위해 여기서는 리스트에만 추가하는 형태가 아니라 실제 DB에 placeholder를 만듭니다)
      
      // *주의*: 실제 운영 시에는 '초대 메일 발송' -> '강사가 링크로 가입' 흐름이 정석입니다.
      // 여기서는 "사전 등록" 개념으로 구현합니다.
      
      const tempUid = `invited_${Date.now()}`; 
      await setDoc(doc(db, "users", tempUid), {
        uid: tempUid,
        email: newEmail,
        name: newName,
        role: "instructor",
        ownerId: user.uid, // 원장님 ID 연결
        academy: userData.academy,
        plan: "BASIC", // 원장님 플랜 따라가거나 기본 설정
        coins: 0,
        createdAt: serverTimestamp(),
        isInvited: true // 초대된 계정임을 표시
      });

      toast.success("강사가 등록되었습니다. 해당 이메일로 로그인하면 연동됩니다.");
      setNewEmail("");
      setNewName("");
      fetchInstructors();
    } catch (e) {
      console.error(e);
      toast.error("등록 실패");
    }
    setIsAdding(false);
  };

  const handleDelete = async (targetUid: string) => {
    if (!confirm("해당 강사를 삭제하시겠습니까?")) return;
    await deleteDoc(doc(db, "users", targetUid));
    toast.success("삭제되었습니다.");
    fetchInstructors();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <IdentificationIcon className="w-8 h-8 text-blue-600" />
            강사 관리
          </h1>
          <p className="text-slate-500 mt-1">우리 학원의 강사진을 등록하고 관리합니다.</p>
        </div>
      </div>

      {/* 등록 폼 */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
        <h3 className="font-bold text-slate-800 mb-4">신규 강사 등록</h3>
        <div className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500">강사명</label>
            <input 
              type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl" placeholder="이름 입력"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-xs font-bold text-slate-500">구글 이메일</label>
            <input 
              type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl" placeholder="example@gmail.com"
            />
          </div>
          <button 
            onClick={handleInvite} disabled={isAdding}
            className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 flex items-center gap-2"
          >
            <UserPlusIcon className="w-5 h-5" /> 등록하기
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">* 등록된 이메일로 강사가 로그인하면 자동으로 학원 소속으로 연동됩니다.</p>
      </div>

      {/* 강사 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {instructors.map((inst) => (
          <div key={inst.uid} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                {inst.name[0]}
              </div>
              <div>
                <p className="font-bold text-slate-900">{inst.name} 선생님</p>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <EnvelopeIcon className="w-3 h-3" /> {inst.email}
                </p>
              </div>
            </div>
            <button onClick={() => handleDelete(inst.uid)} className="text-slate-300 hover:text-red-500 p-2">
              <TrashIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
        {instructors.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl">
            등록된 강사가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}