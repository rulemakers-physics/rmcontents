"use client";

import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import { SCIENCE_UNITS } from "@/types/scienceUnits";
import { motion, AnimatePresence } from "framer-motion";

// 아이콘
import { 
  ChevronDownIcon, 
  DocumentTextIcon, 
  CloudArrowUpIcon,
  XMarkIcon,
  SparklesIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  StarIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

// --- 타입 정의 ---
type RequestMode = 'NONE' | 'BASIC' | 'PREMIUM';

export default function RequestPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  // --- 상태 관리 ---
  const [mode, setMode] = useState<RequestMode>('NONE'); 
  
  // 폼 상태
  const [title, setTitle] = useState("");
  const [contentKind, setContentKind] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [questionCount, setQuestionCount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState<File[]>([]); 
  
  // 단원 선택 상태
  const [openMajorTopics, setOpenMajorTopics] = useState<string[]>([]);
  type SelectedScope = Record<string, Record<string, string[]>>;
  const [selectedScope, setSelectedScope] = useState<SelectedScope>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // 로그인 체크
  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("로그인이 필요한 서비스입니다.");
      router.push("/login");
    }
  }, [user, loading, router]);

  // --- 모드 선택 핸들러 ---
  const handleSelectMode = (selectedMode: RequestMode) => {
    // [수정] user와 userData가 모두 존재하는지 확인 (Type Error 해결)
    if (!user || !userData) return;

    if (selectedMode === 'BASIC') {
        setMode('BASIC');
        setContentKind(""); 
    } 
    else if (selectedMode === 'PREMIUM') {
      // 위에서 user 체크를 했으므로 이제 안전하게 접근 가능
      if (userData.plan !== 'MAKERS' && !user.isAdmin) {
        toast.error("Maker's Plan 전용 서비스입니다. 플랜을 업그레이드 해주세요.");
        return;
      }
      setMode('PREMIUM');
      setContentKind(""); 
    }
  };

  // --- 단원 선택 로직 ---
  const toggleMajorTopic = (majorTopicName: string) => {
    setOpenMajorTopics(prev =>
      prev.includes(majorTopicName) ? prev.filter(n => n !== majorTopicName) : [...prev, majorTopicName]
    );
  };

  const handleMinorTopicChange = (subject: string, major: string, minor: string, checked: boolean) => {
    setSelectedScope(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      if (!next[subject]) next[subject] = {};
      if (!next[subject][major]) next[subject][major] = [];

      if (checked) {
        if (!next[subject][major].includes(minor)) next[subject][major].push(minor);
      } else {
        next[subject][major] = next[subject][major].filter((t: string) => t !== minor);
      }

      if (next[subject][major].length === 0) delete next[subject][major];
      if (Object.keys(next[subject]).length === 0) delete next[subject];
      return next;
    });
  };

  const isSelected = (subject: string, major: string, minor: string) => 
    selectedScope[subject]?.[major]?.includes(minor);

  // --- 파일 핸들러 ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
  };
  const removeFile = (idx: number) => setFiles(prev => prev.filter((_, i) => i !== idx));

  // --- 제출 핸들러 ---
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return setError("로그인이 필요합니다.");
    
    if (!title || !contentKind || !quantity || !deadline || Object.keys(selectedScope).length === 0) {
      setError("필수 항목(*)을 모두 입력해주세요. (단원 범위 포함)");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const uploadPromises = files.map(async (file) => {
        const path = `uploads/requests/${user.uid}/${uuidv4()}-${file.name}`;
        const fileRef = ref(storage, path);
        await uploadBytes(fileRef, file);
        return { url: await getDownloadURL(fileRef), path, name: file.name };
      });
      const uploadedFiles = await Promise.all(uploadPromises);

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const uData = userDoc.data();

      const finalTitle = mode === 'PREMIUM' ? `[Premium] ${title}` : title;

      await addDoc(collection(db, "requests"), {
        instructorId: user.uid,
        instructorName: uData?.name || "이름없음",
        academy: uData?.academy || "학원없음",
        title: finalTitle,
        contentKind,
        scope: selectedScope,
        quantity: parseInt(quantity),
        questionCount,
        deadline,
        details,
        referenceFiles: uploadedFiles,
        status: "requested",
        requestedAt: serverTimestamp(),
        isPremium: mode === 'PREMIUM'
      });

      toast.success("요청이 성공적으로 접수되었습니다.");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("요청 중 오류가 발생했습니다.");
      setIsSubmitting(false);
    }
  };

  if (loading || !user) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // ----------------------------------------------------------------------
  // VIEW 1: 랜딩 페이지 (Mode Selection)
  // ----------------------------------------------------------------------
  if (mode === 'NONE') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
        <div className="max-w-6xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
              어떤 컨텐츠가 필요하신가요?
            </h1>
            <p className="text-lg text-slate-500">
              선생님께서 요청하실 컨텐츠의 종류를 선택해주세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 px-4">
            
            {/* [Basic Card] 깔끔한 기본 스타일 */}
            <motion.div 
              whileHover={{ y: -6 }}
              onClick={() => handleSelectMode('BASIC')}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-blue-100/50 hover:border-blue-400 cursor-pointer transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold uppercase tracking-wider">
                  Basic Plan
                </span>
                <DocumentTextIcon className="w-8 h-8 text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                내신대비 실전 모의고사 & N제
              </h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed h-12">
                학교별 기출 경향과 시험 범위를 완벽 반영한<br/>높은 적중률의 내신 대비 컨텐츠 제작
              </p>

              <ul className="space-y-3 mb-10 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <ShieldCheckIcon className="w-5 h-5 text-blue-500" /> Basic Plan 이상 이용 가능
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-blue-500" /> 3일 이내 제작, 기출 경향 완벽 반영
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <ExclamationTriangleIcon className="w-5 h-5" /> 맞춤형 문항 교체 및 피드백 불가능
                </li>
              </ul>

              <div className="w-full py-4 rounded-xl border-2 border-slate-100 text-slate-600 font-bold text-center group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-200 transition-all">
                제작 요청하기
              </div>
            </motion.div>

            {/* [Premium Card] White & Gold Luxury Style */}
            <motion.div 
              whileHover={{ y: -6 }}
              onClick={() => handleSelectMode('PREMIUM')}
              className="relative bg-white rounded-3xl p-8 border border-amber-200 shadow-lg shadow-amber-100/40 hover:shadow-2xl hover:shadow-amber-200/50 hover:border-amber-400 cursor-pointer transition-all group overflow-hidden"
            >
              {/* 은은한 배경 그라데이션 */}
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/30 via-white to-amber-50/10 pointer-events-none"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold uppercase tracking-wider border border-amber-200">
                    <StarIcon className="w-3 h-3" /> Maker's Plan Only
                  </div>
                  <SparklesIcon className="w-8 h-8 text-amber-400 group-hover:text-amber-500 transition-colors" />
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 to-yellow-600 group-hover:from-amber-500 group-hover:to-yellow-500 transition-all">
                    Custom 모의고사 & 킬러 문항
                  </span>
                </h2>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed h-12">
                  RuleMakers의 핵심 자산을 모두 이용한 프리미엄 제작<br/>
                  무제한 피드백, 1:1 컨시어지 서비스
                </p>

                <ul className="space-y-3 mb-10 text-sm">
                  <li className="flex items-center gap-2 text-slate-700 font-medium">
                    <ShieldCheckIcon className="w-5 h-5 text-amber-500" /> Maker&apos;s Plan 전용
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircleIcon className="w-5 h-5 text-amber-400" /> 무제한 피드백 & 맞춤형 문항 교체 & 커스텀 컨텐츠 무제한 요청 가능
                  </li>
                  <li className="flex items-center gap-2 text-slate-600">
                    <CheckCircleIcon className="w-5 h-5 text-amber-400" /> 자체 제작 킬러 N제인 "고난이도 문항모음zip" 요청 가능
                  </li>
                </ul>

                <div className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold text-center shadow-lg shadow-amber-200 group-hover:shadow-amber-300 group-hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  <span>제작 요청하기</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </div>
              </div>

              {/* Lock Overlay */}
              {userData?.plan !== 'MAKERS' && !user.isAdmin && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center transition-opacity hover:bg-white/50">
                  <div className="p-4 rounded-full bg-slate-50 border border-slate-200 mb-3 shadow-md">
                    <LockClosedIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-lg mb-1">Maker&apos;s Plan 전용</h3>
                  <p className="text-sm text-slate-500">업그레이드 후 이용 가능합니다</p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // VIEW 2: 입력 폼 (Light Mode Base + Color Accents)
  // ----------------------------------------------------------------------
  
  const isPremium = mode === 'PREMIUM';
  
  // 테마 설정 (배경은 항상 밝게, 포인트 컬러만 변경)
  const theme = {
    // 배경: 프리미엄은 아주 연한 앰버톤으로 따뜻함 추가
    wrapper: isPremium ? "bg-amber-50/30" : "bg-slate-50", 
    // 헤더 텍스트
    headerTitle: isPremium ? "text-amber-900" : "text-slate-900",
    headerSub: isPremium ? "text-amber-700/70" : "text-slate-500",
    
    // 카드 스타일
    card: isPremium 
      ? "bg-white border-amber-200 shadow-xl shadow-amber-100/50" 
      : "bg-white border-slate-200 shadow-sm",
    
    // 섹션 제목 & 아이콘
    sectionTitle: isPremium ? "text-amber-900" : "text-slate-800",
    iconColor: isPremium ? "text-amber-500" : "text-indigo-600",
    
    // 입력창 (중요: 글자는 항상 진하게)
    input: isPremium 
      ? "bg-white border-amber-200 text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:ring-amber-200" 
      : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-100",
    
    // 버튼
    buttonPrimary: isPremium
      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200 border-0"
      : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100",
      
    // 체크박스/라디오
    checkbox: isPremium ? "text-amber-500 focus:ring-amber-500" : "text-indigo-600 focus:ring-indigo-500",
    
    // 토픽 리스트 헤더
    topicHeader: isPremium ? "bg-amber-50 text-amber-900" : "bg-slate-100 text-slate-700",
  };

  return (
    <div className={`min-h-screen pt-12 pb-32 px-4 transition-colors duration-500 ${theme.wrapper}`}>
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8 border-b border-slate-200 pb-6 flex justify-between items-end">
          <div>
            <button 
              onClick={() => setMode('NONE')}
              className="text-sm mb-2 hover:underline flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors"
            >
              ← 종류 다시 선택
            </button>
            <h1 className={`text-3xl font-bold flex items-center gap-2 ${theme.headerTitle}`}>
              {isPremium ? "Maker's 제작 요청" : "Basic 제작 요청"}
            </h1>
            <p className={`mt-2 ${theme.headerSub}`}>
              {isPremium 
                ? "Maker's Plan 전담팀이 선생님의 요청사항을 정밀하게 분석하여 제작합니다."
                : "필요한 컨텐츠의 세부 사항을 입력해주세요."
              }
            </p>
          </div>
          {isPremium && (
            <div className="hidden md:block px-4 py-2 bg-amber-100 rounded-lg text-amber-900 text-xs font-bold uppercase tracking-wider border border-amber-300">
              Custom Concierge Service
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* 1. 기본 정보 */}
          <section className={`p-6 md:p-8 rounded-2xl border ${theme.card}`}>
            <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${theme.sectionTitle}`}>
              <DocumentTextIcon className={`w-6 h-6 ${theme.iconColor}`} />
              기본 정보
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-2 text-slate-700">제목 *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 2025 1학기 중간고사 대비 모의고사"
                  className={`w-full rounded-xl px-4 py-3 border outline-none transition-all shadow-sm ${theme.input}`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700">컨텐츠 종류 *</label>
                <div className="relative">
                  <select 
                    value={contentKind}
                    onChange={(e) => setContentKind(e.target.value)}
                    className={`w-full rounded-xl px-4 py-3 border outline-none appearance-none cursor-pointer transition-all shadow-sm ${theme.input}`}
                  >
                    <option value="" disabled>선택해주세요</option>
                    {isPremium ? (
                      <>
                        <option value="학교별 실전 모의고사 (Custom)">학교별 실전 모의고사 (Custom)</option>
                        <option value="학교별 내신 대비 N제 (Custom)">학교별 내신 대비 N제 (Custom)</option>
                        <option value="고난도 문항모음zip">고난도 문항모음zip (Killer)</option>
                      </>
                    ) : (
                      <>
                        <option value="학교별 실전 모의고사">학교별 실전 모의고사</option>
                        <option value="학교별 내신 대비 N제">학교별 내신 대비 N제</option>
                      </>
                    )}
                  </select>
                  <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700">완료 희망일 *</label>
                <input 
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 border outline-none transition-all shadow-sm ${theme.input}`} 
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700">요청 수량 (Set) *</label>
                <input 
                  type="number" 
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 border outline-none transition-all shadow-sm ${theme.input}`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700">문항 구성 (객관식/서술형)</label>
                <input 
                  type="text" 
                  value={questionCount}
                  onChange={(e) => setQuestionCount(e.target.value)}
                  placeholder="예: 객관식 20문항 + 서술형 4문항"
                  className={`w-full rounded-xl px-4 py-3 border outline-none transition-all shadow-sm ${theme.input}`}
                />
              </div>
            </div>
          </section>

          {/* 2. 범위 설정 */}
          <section className={`p-6 md:p-8 rounded-2xl border ${theme.card}`}>
            <h2 className={`text-xl font-semibold mb-2 flex items-center gap-2 ${theme.sectionTitle}`}>
              <CheckCircleIcon className={`w-6 h-6 ${theme.iconColor}`} />
              출제 범위 설정 *
            </h2>
            <p className="text-sm mb-6 text-slate-500">필요한 단원을 모두 체크해주세요.</p>

            <div className="space-y-4">
              {SCIENCE_UNITS.map((subject) => (
                <div key={subject.name} className={`rounded-xl overflow-hidden border transition-all ${isPremium ? 'border-amber-100' : 'border-slate-200'}`}>
                  <div className={`px-4 py-3 font-bold text-sm ${theme.topicHeader}`}>
                    {subject.name}
                  </div>
                  <div className="divide-y divide-slate-100 bg-white">
                    {subject.majorTopics.map((major) => {
                      const isOpen = openMajorTopics.includes(major.name);
                      return (
                        <div key={major.name}>
                          <button
                            type="button"
                            onClick={() => toggleMajorTopic(major.name)}
                            className="w-full flex justify-between items-center px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {major.name}
                            <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div 
                                initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white">
                                  {major.minorTopics.map((minor) => (
                                    <label key={minor} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                                      <input 
                                        type="checkbox"
                                        checked={isSelected(subject.name, major.name, minor) || false}
                                        onChange={(e) => handleMinorTopicChange(subject.name, major.name, minor, e.target.checked)}
                                        className={`rounded w-4 h-4 border-slate-300 ${theme.checkbox}`}
                                      />
                                      <span className="text-sm text-slate-600">{minor}</span>
                                    </label>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. 상세 내용 및 파일 첨부 */}
          <section className={`p-6 md:p-8 rounded-2xl border ${theme.card}`}>
            <h2 className={`text-xl font-semibold mb-6 flex items-center gap-2 ${theme.sectionTitle}`}>
              <CloudArrowUpIcon className={`w-6 h-6 ${theme.iconColor}`} />
              추가 요청사항 및 자료
            </h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold mb-2 text-slate-700">상세 요청사항</label>
                <textarea 
                  rows={5}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder={isPremium 
                    ? "킬러 문항의 난이도, 특정 유형 강화 등 요청사항을 자유롭게 작성해주세요." 
                    : "기출 문제의 특이사항이나 참고할 내용을 적어주세요."}
                  className={`w-full rounded-xl px-4 py-3 border outline-none resize-none transition-all shadow-sm ${theme.input}`}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-3 text-slate-700">참고 자료 업로드 (PDF, 이미지 등)</label>
                <div className="flex items-center gap-3">
                  <label className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-bold transition-all flex items-center gap-2 shadow-sm
                    ${isPremium 
                      ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100" 
                      : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                    }`}>
                    <CloudArrowUpIcon className="w-5 h-5" />
                    파일 선택
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                  </label>
                  <span className="text-xs text-slate-400">
                    * 학교 기출문제나 진도표 등을 첨부해주세요.
                  </span>
                </div>

                {files.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {files.map((file, idx) => (
                      <li key={idx} className="flex items-center justify-between p-3 rounded-lg text-sm border bg-slate-50 border-slate-200 text-slate-700">
                        <span className="truncate">{file.name}</span>
                        <button type="button" onClick={() => removeFile(idx)} className="text-slate-400 hover:text-red-500">
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-4 pt-4">
             {error && <p className="text-red-500 text-sm font-medium animate-pulse">{error}</p>}
             <button 
               type="submit" 
               disabled={isSubmitting}
               className={`px-8 py-3 rounded-xl font-bold shadow-lg transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${theme.buttonPrimary}`}
             >
               {isSubmitting ? "처리 중..." : (isPremium ? "요청 제출하기" : "요청 제출하기")}
             </button>
          </div>
          {/* [수정] 하단 강제 여백 추가 */}
          <div className="h-32 w-full shrink-0" aria-hidden="true" />

        </form>
      </div>
    </div>
  );
}