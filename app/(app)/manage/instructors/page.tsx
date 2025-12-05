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

    setIsAdding(true);
    try {
      // 1. [신규 로직] 이미 가입된 유저인지 이메일로 확인
      const q = query(collection(db, "users"), where("email", "==", newEmail));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 1-A. 이미 존재하는 유저인 경우 -> 연결(Link)만 수행
        const existingUserDoc = querySnapshot.docs[0];
        
        if (confirm("이미 가입된 회원입니다. 우리 학원 강사로 등록(연동)하시겠습니까?")) {
          await updateDoc(doc(db, "users", existingUserDoc.id), {
            ownerId: user.uid, // 원장님 ID 연결
            // role: 'instructor', // ※ 주의: 상대가 Admin일 수도 있으므로 role은 함부로 덮어쓰지 않는 게 안전합니다.
            // 필요하다면: role: existingUserDoc.data().role === 'admin' ? 'admin' : 'instructor' 로직 추가
          });
          toast.success("기존 회원을 강사로 등록했습니다.");
          setNewEmail("");
          setNewName("");
          fetchInstructors();
        }
      } else {
        // 1-B. 존재하지 않는 유저인 경우 -> 초대용 임시 문서 생성 (기존 로직)
        const tempUid = `invited_${Date.now()}`; 
        await setDoc(doc(db, "users", tempUid), {
          uid: tempUid,
          email: newEmail,
          name: newName,
          role: "instructor",
          ownerId: user.uid,
          academy: userData.academy,
          plan: "BASIC", // 원장님 플랜 따라가거나 기본 설정 (FREE로 해도 됨)
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
      // 실제 유저라면 ownerId 연결만 끊을지, 아니면 문서를 삭제할지 정책 결정 필요.
      // 여기서는 '등록 해제' 개념으로 ownerId를 삭제(FieldDelete)하거나, 
      // 초대 계정(isInvited)이라면 문서를 삭제하는 것이 맞습니다.
      
      // 편의상 문서 삭제로 유지하되, 실제 운영 시엔 updateDoc(..., { ownerId: deleteField() }) 권장
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
        <p className="text-xs text-slate-400 mt-2">* 등록된 이메일로 강사가 로그인하면 자동으로 학원 소속으로 연동됩니다.</p>
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