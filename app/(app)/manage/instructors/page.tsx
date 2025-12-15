// app/(app)/manage/instructors/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, query, where, getDocs, setDoc, doc, deleteDoc, serverTimestamp, updateDoc 
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

  const fetchInstructors = async () => {
    if (!user) return;
    const q = query(
      collection(db, "users"),
      where("ownerId", "==", user.uid)
    );
    const snap = await getDocs(q);
    setInstructors(snap.docs.map(d => d.data() as UserData));
  };

  useEffect(() => {
    fetchInstructors();
  }, [user]);

  const handleInvite = async () => {
    if (!newEmail || !newName) return toast.error("이름과 이메일을 입력해주세요.");
    if (!user || !userData) return;

    // [핵심] 원장님의 현재 플랜을 가져옵니다.
    const directorPlan = userData.plan || "FREE";

    setIsAdding(true);
    try {
      // 1. 이미 가입된 유저인지 확인
      const q = query(collection(db, "users"), where("email", "==", newEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // [Case A] 이미 존재하는 유저 -> 연동 및 플랜 업데이트
        const existingUserDoc = querySnapshot.docs[0];
        
        if (confirm("이미 가입된 회원입니다. 우리 학원 강사로 등록하시겠습니까?\n(원장님의 요금제가 적용됩니다)")) {
          await updateDoc(doc(db, "users", existingUserDoc.id), {
            ownerId: user.uid, // 원장님 ID 연결
            plan: directorPlan, // [수정] 원장님 플랜 적용
            academy: userData.academy // 학원명도 동기화
          });
          toast.success("기존 회원을 강사로 등록했습니다.");
          setNewEmail("");
          setNewName("");
          fetchInstructors();
        }
      } else {
        // [Case B] 신규 초대 (가계정 생성) -> 플랜 설정하여 생성
        const tempUid = `invited_${Date.now()}`; 
        await setDoc(doc(db, "users", tempUid), {
          uid: tempUid,
          email: newEmail,
          name: newName,
          role: "instructor",
          ownerId: user.uid,
          academy: userData.academy,
          plan: directorPlan, // [수정] 원장님 플랜 적용 (BASIC -> directorPlan)
          coins: 0,
          createdAt: serverTimestamp(),
          isInvited: true
        });
        toast.success("강사가 등록되었습니다. 해당 이메일로 로그인하면 연동됩니다.");
        setNewEmail("");
        setNewName("");
        fetchInstructors();
      }

    } catch (e) {
      console.error(e);
      toast.error("등록 실패");
    }
    setIsAdding(false);
  };

  const handleDelete = async (targetUid: string) => {
    if (!confirm("해당 강사를 삭제하시겠습니까?")) return;
    try {
      // 강사 삭제 시 플랜을 어떻게 처리할지는 정책에 따라 다름 (여기선 삭제만)
      await deleteDoc(doc(db, "users", targetUid));
      toast.success("삭제되었습니다.");
      fetchInstructors();
    } catch (e) {
      toast.error("삭제 실패");
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <IdentificationIcon className="w-8 h-8 text-blue-600" />
            강사 관리
          </h1>
          <p className="text-slate-500 mt-1">우리 학원의 강사진을 등록하고 관리합니다.</p>
        </div>
      </div>

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
        <p className="text-xs text-slate-400 mt-2">
          * 등록된 강사는 <strong>{userData?.plan} Plan</strong> 혜택을 자동으로 공유받습니다.
        </p>
      </div>

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
                {/* 강사의 현재 플랜 표시 */}
                <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 mt-1 inline-block">
                  {inst.plan} Plan
                </span>
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