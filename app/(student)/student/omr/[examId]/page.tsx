// app/(student)/student/omr/[examId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { toast } from "react-hot-toast";
import { CheckCircleIcon, XCircleIcon, PaperAirplaneIcon, UserIcon } from "@heroicons/react/24/solid";
import { SavedExam } from "@/types/exam";
import { StudentData } from "@/types/academy";
import { WrongProblemInfo } from "@/types/grade";

export default function OMRPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();

  // 상태: 'login' (신원확인) | 'exam' (응시) | 'result' (완료)
  const [step, setStep] = useState<'login' | 'exam' | 'result'>('login');
  
  // 데이터
  const [examData, setExamData] = useState<SavedExam | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentData | null>(null);
  
  // 입력값
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. 시험지 정보 로드
  useEffect(() => {
    if (!examId) return;
    const fetchExam = async () => {
      const docRef = doc(db, "saved_exams", examId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setExamData({ id: snap.id, ...snap.data() } as SavedExam);
      } else {
        toast.error("유효하지 않은 시험지 QR입니다.");
      }
    };
    fetchExam();
  }, [examId]);

  // 2. 원생 인증 핸들러
  const handleVerifyStudent = async () => {
    if (!name || phoneLast4.length !== 4) return toast.error("정보를 정확히 입력해주세요.");
    if (!examData) return;

    try {
      // 해당 강사(userId)가 등록한 학생 중에서 검색
      const q = query(
        collection(db, "students"),
        where("instructorId", "==", examData.userId), 
        where("name", "==", name)
      );
      const snap = await getDocs(q);
      
      const matched = snap.docs.find(d => {
        const p = d.data().phone || "";
        return p.endsWith(phoneLast4);
      });

      if (matched) {
        setStudentInfo({ id: matched.id, ...matched.data() } as StudentData);
        setStep('exam');
        toast.success(`${name} 학생 확인되었습니다!`);
      } else {
        // [모니터링 연계] 미등록 학생 처리
        if(confirm("등록된 학생 정보가 없습니다.\n새로운 학생으로 등록하고 응시하시겠습니까?")) {
           // 임시 학생 등록 로직 (선택 사항)
           // 여기서는 UX상 일단 진행하지 않도록 처리하거나, 관리자에게 알림을 보낼 수 있습니다.
           toast.error("선생님께 문의해주세요.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("인증 중 오류가 발생했습니다.");
    }
  };

  // 3. 답안 제출 및 채점 핸들러
  const handleSubmit = async () => {
    if (!examData || !studentInfo) return;
    
    // 답안 입력 확인
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < examData.problems.length) {
      if (!confirm(`아직 ${examData.problems.length - answeredCount}문제를 풀지 않았습니다. 제출할까요?`)) return;
    }

    setIsSubmitting(true);

    try {
      // 채점 로직
      let score = 0;
      let correctCount = 0;
      const results: Record<number, boolean> = {};
      // [수정] 타입 변경
      const wrongProblems: WrongProblemInfo[] = [];

      examData.problems.forEach((p) => {
        const userAns = answers[p.number] || "";
        const correctAns = p.answer || "";
        const isCorrect = String(userAns).trim() === String(correctAns).trim();
        
        results[p.number] = isCorrect;
        if (isCorrect) {
          correctCount++;
        } else {
          // [수정] ID와 번호 저장
          wrongProblems.push({ id: p.id, number: p.number });
        }
      });

      score = Math.round((correctCount / examData.problems.length) * 100);

      // exam_results 업데이트 (트랜잭션 대신 간단한 조회-업데이트 사용)
      // 1. 해당 시험지, 해당 반의 결과 문서 찾기
      const resultsRef = collection(db, "exam_results");
      const q = query(
        resultsRef,
        where("examId", "==", examId),
        where("classId", "==", studentInfo.classId)
      );
      const snap = await getDocs(q);

      const newScoreData = {
        studentId: studentInfo.id,
        studentName: studentInfo.name,
        score,
        answers,
        results,
        wrongProblems
      };

      if (!snap.empty) {
        // 기존 결과 문서가 있으면 업데이트
        const docId = snap.docs[0].id;
        const currentScores = snap.docs[0].data().scores || [];
        
        // 기존 내 점수 지우고 새로 추가 (덮어쓰기)
        const updatedScores = currentScores.filter((s: any) => s.studentId !== studentInfo.id);
        updatedScores.push(newScoreData);

        // 통계 재계산
        const total = updatedScores.length;
        const avg = updatedScores.reduce((acc: number, cur: any) => acc + cur.score, 0) / total;
        const highest = Math.max(...updatedScores.map((s: any) => s.score));

        await updateDoc(doc(db, "exam_results", docId), {
          scores: updatedScores,
          average: avg,
          highest: highest,
          totalStudents: total
        });
      } else {
        // 결과 문서가 없으면 생성 (최초 제출)
        // 반 정보(className)를 가져오기 위해 class doc 조회 필요할 수 있음
        // 여기서는 편의상 studentInfo의 정보를 활용하거나, examData의 정보 활용
        await setDoc(doc(resultsRef), {
          examId: examId,
          classId: studentInfo.classId,
          className: "자동 생성된 리포트", // 추후 class DB에서 가져오도록 보완 가능
          examTitle: examData.title,
          date: serverTimestamp(),
          scores: [newScoreData],
          average: score,
          highest: score,
          totalStudents: 1
        });
      }

      setStep('result');
      toast.success("제출 완료! 수고하셨습니다.");

    } catch (e) {
      console.error(e);
      toast.error("제출 실패");
    }
    setIsSubmitting(false);
  };

  if (!examData) return <div className="flex h-screen items-center justify-center">시험지 정보를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        
        {/* 헤더 */}
        <div className="bg-slate-900 p-6 text-white text-center">
          <h1 className="text-xl font-bold mb-1">{examData.title}</h1>
          <p className="text-sm text-slate-400">OMR 답안 제출</p>
        </div>

        {/* Step 1: 로그인 */}
        {step === 'login' && (
          <div className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">원생 인증</h2>
              <p className="text-sm text-slate-500">이름과 휴대폰 번호 뒷자리를 입력해주세요.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">이름</label>
                <input 
                  type="text" value={name} onChange={e => setName(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">휴대폰 번호 (뒷 4자리)</label>
                <input 
                  type="tel" maxLength={4} value={phoneLast4} onChange={e => setPhoneLast4(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-blue-500 outline-none"
                  placeholder="1234"
                />
              </div>
            </div>

            <button 
              onClick={handleVerifyStudent}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
            >
              확인 및 시작하기
            </button>
          </div>
        )}

        {/* Step 2: OMR 입력 */}
        {step === 'exam' && (
          <div className="p-0">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-sm font-bold text-blue-800">
              <span>{studentInfo?.name} 학생</span>
              <span>진행률: {Math.round((Object.keys(answers).length / examData.problems.length) * 100)}%</span>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {examData.problems.map((p: any) => (
                <div key={p.number} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50">
                  <span className="w-8 font-bold text-slate-500 text-center">{p.number}</span>
                  <div className="flex-1 grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setAnswers(prev => ({ ...prev, [p.number]: String(num) }))}
                        className={`h-10 rounded-lg font-bold transition-all ${
                          answers[p.number] === String(num) 
                            ? 'bg-blue-600 text-white shadow-md scale-105' 
                            : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isSubmitting ? "채점 중..." : <><PaperAirplaneIcon className="w-5 h-5"/> 답안 제출하기</>}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 완료 */}
        {step === 'result' && (
          <div className="p-10 text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
              <CheckCircleIcon className="w-12 h-12" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">제출 완료!</h2>
              <p className="text-slate-500 mt-2">선생님께 결과가 전송되었습니다.<br/>결과 분석은 학원에서 확인하세요.</p>
            </div>
            <button 
              onClick={() => window.close()}
              className="px-6 py-2 text-slate-400 font-bold hover:text-slate-600 underline"
            >
              창 닫기
            </button>
          </div>
        )}

      </div>
    </div>
  );
}