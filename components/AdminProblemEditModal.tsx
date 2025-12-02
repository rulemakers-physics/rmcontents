// components/AdminProblemEditModal.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc, deleteDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { toast } from "react-hot-toast";
import { XMarkIcon, TrashIcon, CheckIcon, ClockIcon } from "@heroicons/react/24/outline";
import { SCIENCE_UNITS } from "@/types/scienceUnits";
import { Problem } from "@/app/(app)/admin/problems/page";
import { RESEARCHERS } from "@/constants/researchers"; // [신규] 상수 임포트
import ProblemHistoryModal from "./ProblemHistoryModal"; // [신규] 이력 모달 임포트

interface AdminProblemEditModalProps {
  problem: Problem;
  onClose: (needsRefresh?: boolean) => void;
}

export default function AdminProblemEditModal({ problem, onClose }: AdminProblemEditModalProps) {
  const { user } = useAuth();
  
  // 폼 상태
  const [formData, setFormData] = useState({
    majorTopic: problem.majorTopic || "",
    minorTopic: problem.minorTopic || "",
    difficulty: problem.difficulty || "중",
    answer: problem.answer || "",
  });

  // [신규] 수정 정보 상태
  const [modifier, setModifier] = useState(""); // 연구원 이름
  const [reason, setReason] = useState("");     // 수정 사유
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false); // 이력 모달 표시 여부

  const selectedSubject = SCIENCE_UNITS.find(u => 
    u.majorTopics.some(m => m.name === formData.majorTopic)
  ) || SCIENCE_UNITS[0]; 

  const selectedMajor = selectedSubject.majorTopics.find(m => m.name === formData.majorTopic);

  // 이력 저장 함수
  const logAction = async (action: 'update' | 'delete', changes?: Record<string, any>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "problem_logs"), {
        problemId: problem.id,
        problemFilename: problem.filename,
        action: action,
        editorUid: user.uid,
        editorEmail: user.email,
        editorName: modifier || user.displayName || "Admin", // 선택한 연구원 이름 우선
        reason: reason || "사유 미기재", // 사유 저장
        changes: changes || null,
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("이력 저장 실패:", e);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // [유효성 검사] 수정자와 사유 필수
    if (!modifier) {
      toast.error("담당 연구원을 선택해주세요.");
      return;
    }
    if (!reason.trim()) {
      toast.error("수정 사유를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. 변경 감지
      const changes: Record<string, any> = {};
      if (formData.majorTopic !== problem.majorTopic) changes.majorTopic = { from: problem.majorTopic, to: formData.majorTopic };
      if (formData.minorTopic !== problem.minorTopic) changes.minorTopic = { from: problem.minorTopic, to: formData.minorTopic };
      if (formData.difficulty !== problem.difficulty) changes.difficulty = { from: problem.difficulty, to: formData.difficulty };
      if (formData.answer !== problem.answer) changes.answer = { from: problem.answer, to: formData.answer };

      if (Object.keys(changes).length === 0) {
        toast("변경 사항이 없습니다.");
        setIsSaving(false);
        return;
      }

      // 2. DB 업데이트
      const docRef = doc(db, "problems", problem.id);
      await updateDoc(docRef, {
        ...formData,
        difficultyScore: formData.difficulty === '킬러' ? 3.5 : formData.difficulty === '상' ? 2.5 : 1.5 
      });

      // 3. 로그 기록
      await logAction('update', changes);

      toast.success("수정되었습니다.");
      onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("수정 실패");
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!user) return;
    // 삭제 시에도 사유를 받도록 유도할 수 있으나, 보통 삭제는 강제성 낮춤 (여기선 연구원만 체크)
    if (!modifier) {
        toast.error("삭제 담당 연구원을 선택해주세요.");
        return;
    }
    if (!confirm("정말 삭제하시겠습니까? (복구 불가)")) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "problems", problem.id));
      
      if (problem.filename) {
         try {
           const imgRef = ref(storage, `problems/${problem.filename}`);
           await deleteObject(imgRef);
         } catch (e) { console.warn(e); }
      }

      await logAction('delete');

      toast.success("문제가 삭제되었습니다.");
      onClose(true);
    } catch (e) {
      console.error(e);
      toast.error("삭제 실패");
    }
    setIsDeleting(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
          
          {/* 왼쪽: 이미지 */}
          <div className="w-full md:w-1/2 bg-slate-100 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative">
            {problem.imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={problem.imgUrl} alt="Preview" className="max-w-full max-h-[60vh] object-contain shadow-lg bg-white rounded-lg" />
            ) : (
              <div className="text-slate-400">이미지 없음</div>
            )}
            <div className="absolute top-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {problem.filename}
            </div>
          </div>

          {/* 오른쪽: 편집 폼 */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">문제 정보 수정</h2>
              <div className="flex gap-2">
                {/* [신규] 이력 보기 버튼 */}
                <button 
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ClockIcon className="w-3.5 h-3.5" /> 이력 보기
                </button>
                <button onClick={() => onClose()} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* 기존 필드들 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">대단원</label>
                  <select 
                    value={formData.majorTopic}
                    onChange={(e) => setFormData({...formData, majorTopic: e.target.value, minorTopic: ""})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="">선택하세요</option>
                    {SCIENCE_UNITS.flatMap(u => u.majorTopics).map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">소단원</label>
                  <select 
                    value={formData.minorTopic}
                    onChange={(e) => setFormData({...formData, minorTopic: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                    disabled={!formData.majorTopic}
                  >
                    <option value="">선택하세요</option>
                    {selectedMajor?.minorTopics.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">난이도</label>
                  <select 
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {['기본', '하', '중', '상', '킬러'].map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">정답</label>
                  <input 
                    type="text" 
                    value={formData.answer} 
                    onChange={(e) => setFormData({...formData, answer: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 my-4" />

              {/* [신규] 수정 기록 입력 섹션 */}
              <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100 space-y-3">
                <h4 className="text-xs font-bold text-yellow-700 uppercase">수정 기록 (필수)</h4>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">담당 연구원</label>
                  <select 
                    value={modifier}
                    onChange={(e) => setModifier(e.target.value)}
                    className="w-full p-2 border border-yellow-200 rounded-lg text-sm bg-white focus:ring-yellow-500 focus:border-yellow-500"
                  >
                    <option value="">연구원 선택</option>
                    {RESEARCHERS.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">수정 사유</label>
                  <input 
                    type="text" 
                    value={reason} 
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="예: 단원 분류 오류 수정"
                    className="w-full p-2 border border-yellow-200 rounded-lg text-sm bg-white focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
              </div>

            </div>

            {/* 푸터 */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-bold px-3 py-2 rounded hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="w-4 h-4" /> 삭제
              </button>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => onClose()}
                  className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-md transition-colors disabled:opacity-50 disabled:bg-blue-400"
                >
                  <CheckIcon className="w-4 h-4" /> 저장하기
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 이력 모달 (조건부 렌더링) */}
      {showHistory && (
        <ProblemHistoryModal 
          problemId={problem.id} 
          problemFilename={problem.filename}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  );
}