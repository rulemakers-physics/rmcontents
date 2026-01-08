// app/(app)/profile/setup/page.tsx

"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db, auth } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { 
  RecaptchaVerifier, 
  linkWithPhoneNumber, 
  ConfirmationResult 
} from "firebase/auth";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { 
  UserIcon, BuildingOffice2Icon, 
  ArrowRightIcon, UserGroupIcon, StarIcon, DevicePhoneMobileIcon, CheckCircleIcon,
  DocumentTextIcon // [신규] 약관 아이콘
} from "@heroicons/react/24/outline"; 
import { UserRole } from "@/types/user";
import { SCIENCE_UNITS } from "@/types/scienceUnits";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function ProfileSetupPage() {
  const { user, checkFirstLogin } = useAuth();
  const router = useRouter();

  // --- 1. State 정의 ---
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // 입력 폼
  const [name, setName] = useState("");
  const [academy, setAcademy] = useState("");
  const [school, setSchool] = useState("");   
  const [grade, setGrade] = useState("1");
  const [targetUnit, setTargetUnit] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // 휴대폰 인증 관련
  const [phone, setPhone] = useState(""); 
  const [otpCode, setOtpCode] = useState(""); 
  const [verificationId, setVerificationId] = useState<ConfirmationResult | null>(null); 
  const [isPhoneVerified, setIsPhoneVerified] = useState(false); 
  
  // [신규] 약관 동의 상태
  const [agreements, setAgreements] = useState({
    terms: false,    // [필수] 이용약관
    privacy: false,  // [필수] 개인정보처리방침
    marketing: false // [선택] 마케팅 정보 수신
  });
  
  // 로딩 상태들
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [timer, setTimer] = useState(0); 
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // --- 2. 데이터 보존 로직 (SessionStorage) ---

  useEffect(() => {
    // 1. 역할 복구
    const savedRole = sessionStorage.getItem("setup_selectedRole");
    if (savedRole) setSelectedRole(savedRole as UserRole);

    // 2. 입력폼 데이터 복구
    const savedName = sessionStorage.getItem("setup_name");
    if (savedName) setName(savedName);

    const savedAcademy = sessionStorage.getItem("setup_academy");
    if (savedAcademy) setAcademy(savedAcademy);

    const savedSchool = sessionStorage.getItem("setup_school");
    if (savedSchool) setSchool(savedSchool);

    // 3. 휴대폰 인증 상태 복구
    const savedIsVerified = sessionStorage.getItem("setup_isVerified");
    const savedPhone = sessionStorage.getItem("setup_phone");
    
    if (savedIsVerified === "true" && savedPhone) {
      setIsPhoneVerified(true);
      setPhone(savedPhone);
    }
  }, []);

  // 입력 값 변경 핸들러들
  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    sessionStorage.setItem("setup_selectedRole", role);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    sessionStorage.setItem("setup_name", e.target.value);
  };

  const handleAcademyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAcademy(e.target.value);
    sessionStorage.setItem("setup_academy", e.target.value);
  };

  const handleSchoolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchool(e.target.value);
    sessionStorage.setItem("setup_school", e.target.value);
  };

  // [신규] 전체 동의 핸들러
  const handleAllAgree = (checked: boolean) => {
    setAgreements({
      terms: checked,
      privacy: checked,
      marketing: checked
    });
  };

  // [신규] 개별 동의 핸들러
  const handleSingleAgree = (key: keyof typeof agreements) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 모든 세션 데이터 삭제 (가입 완료 시 호출)
  const clearSessionData = () => {
    sessionStorage.removeItem("setup_selectedRole");
    sessionStorage.removeItem("setup_name");
    sessionStorage.removeItem("setup_academy");
    sessionStorage.removeItem("setup_school");
    sessionStorage.removeItem("setup_phone");       
    sessionStorage.removeItem("setup_isVerified");  
  };

  const handleResetRole = () => {
    setSelectedRole(null);
    clearSessionData();
  };

  // --- 3. useEffect (타이머, 리캡차) ---

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // 리캡차 & 이미 인증된 사용자 처리
  useEffect(() => {
    if (!auth || !recaptchaContainerRef.current) return;
    
    if (user?.phoneNumber) {
      setIsPhoneVerified(true);
      if (!phone) {
        const p = user.phoneNumber.replace("+82", "0");
        setPhone(p);
        sessionStorage.setItem("setup_phone", p);
        sessionStorage.setItem("setup_isVerified", "true");
      }
    }

    const clearRecaptcha = () => {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch (e) {}
        window.recaptchaVerifier = null;
      }
    };
    clearRecaptcha();

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        'size': 'invisible', 
        'callback': () => {},
        'expired-callback': () => toast.error("리캡차 인증 만료. 다시 시도해주세요.")
      });
    } catch (e) { 
      console.error("Recaptcha Init Error:", e); 
    }

    return () => { clearRecaptcha(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 4. 핸들러 함수들 ---

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); 
    if (value.length <= 11) {
      setPhone(value);
      sessionStorage.setItem("setup_phone", value); 
    }
  };

  const sendVerificationCode = async () => {
    if (!phone) return toast.error("휴대폰 번호를 입력해주세요.");
    if (phone.length < 10) return toast.error("올바른 휴대폰 번호를 입력해주세요.");
    if (!user) return;

    setIsSendingSms(true); 
    const formattedPhone = phone.startsWith("0") ? "+82" + phone.slice(1) : phone; 

    try {
      if (!window.recaptchaVerifier && recaptchaContainerRef.current) {
         window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { 'size': 'invisible' });
      }

      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await linkWithPhoneNumber(user, formattedPhone, appVerifier);
      
      setVerificationId(confirmationResult);
      setTimer(180); 
      toast.success("인증번호가 발송되었습니다.");

    } catch (error: any) {
      console.error("SMS Error:", error);
      if (error.code === 'auth/provider-already-linked') {
        setIsPhoneVerified(true);
        sessionStorage.setItem("setup_isVerified", "true"); 
        toast.success("이미 인증된 계정입니다.");
        setVerificationId(null);
      } else if (error.code === 'auth/credential-already-in-use') {
        toast.error("이미 다른 계정에서 사용 중인 번호입니다.");
      } else {
        toast.error("전송 실패. 잠시 후 다시 시도해주세요.");
      }
      
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = null; 
      }
    } finally {
      setIsSendingSms(false); 
    }
  };

  const verifyCode = async () => {
    if (!verificationId) return;
    if (!otpCode) return toast.error("인증번호를 입력해주세요.");
    if (timer === 0) return toast.error("시간 만료. 재전송해주세요.");

    setIsVerifying(true); 

    try {
      await verificationId.confirm(otpCode);
      
      setIsPhoneVerified(true);
      sessionStorage.setItem("setup_isVerified", "true"); 
      sessionStorage.setItem("setup_phone", phone);
      
      setVerificationId(null);
      setOtpCode("");

      toast.success("본인 인증 완료!");
      
      try { await user?.reload(); } catch(e) { console.log(e); }

    } catch (error: any) {
      if (error.code === 'auth/credential-already-in-use') {
        toast.error("이미 다른 계정에 등록된 번호입니다.");
      } else if (error.code === 'auth/invalid-verification-code') {
        toast.error("인증번호 불일치.");
      } else {
        toast.error("인증 실패.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    // [신규] 필수 약관 체크
    if (!agreements.terms || !agreements.privacy) {
      return toast.error("서비스 이용을 위해 필수 약관에 동의해주세요.");
    }

    if (!isPhoneVerified) return toast.error("휴대폰 인증을 완료해주세요.");
    if (!name.trim()) return toast.error("이름을 입력해주세요.");
    if ((selectedRole === 'director' || selectedRole === 'instructor') && !academy.trim()) return toast.error("소속명은 필수입니다.");
    if (selectedRole === 'student' && !school.trim()) return toast.error("학교명은 필수입니다.");

    setIsSubmitting(true); 

    try {
      const userDocRef = doc(db, "users", user.uid);
      
      const baseData = {
        uid: user.uid,
        email: user.email,
        name: name,
        role: selectedRole,
        phone: phone, 
        createdAt: serverTimestamp(),
        isInvited: false,
        // [신규] 약관 동의 내역 저장
        agreements: {
          termsOfService: true,
          privacyPolicy: true,
          marketing: agreements.marketing, // 마케팅 동의 여부 저장
          agreedAt: serverTimestamp() 
        }
      };

      let additionalData = {};
      if (selectedRole === 'student') {
        additionalData = {
          school: school,
          grade: parseInt(grade) || 1,
          targetUnit: targetUnit,
          parentPhone: parentPhone,
          plan: 'FREE',
          academy: "RuleMakers Online",
        };
      } else if (selectedRole === 'director') {
        additionalData = {
          academy: academy,
          plan: 'FREE', 
          ownerId: user.uid,
          coins: 0
        };
      } else {
        additionalData = {
          academy: academy,
          school: school,
          plan: 'FREE',
          ownerId: user.uid,
          coins: 0
        };
      }

      await setDoc(userDocRef, { ...baseData, ...additionalData }, { merge: true });
      
      clearSessionData();
      
      await new Promise(resolve => setTimeout(resolve, 2000)); 
      await user.getIdToken(true);
      await checkFirstLogin(user);
      
      toast.success(`${name}님 환영합니다!`);
      
      if (selectedRole === 'student') {
        router.push("/student/dashboard");
      } else {
        router.push("/dashboard");
      }

    } catch (err) {
      console.error("Setup Error:", err);
      toast.error("저장 실패. 다시 시도해주세요.");
      setIsSubmitting(false); 
    }
  };

  const integratedScienceUnits = SCIENCE_UNITS.flatMap(s => s.majorTopics.map(m => m.name));
  const isStudent = selectedRole === 'student';
  const isDirector = selectedRole === 'director';

  // --- 5. 렌더링 ---
  if (!user) return null;

  // [중요] 제출 중 화면 깜빡임 방지용 로딩 화면
  if (isSubmitting) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">회원가입 마무리 중...</h2>
          <p className="text-slate-500 text-center text-sm">
            정보를 안전하게 저장하고<br/>대시보드로 이동합니다.
          </p>
        </div>
      </div>
    );
  }

  // Step 1: 역할 선택
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">RuleMakers 이용 목적을 선택해주세요</h1>
          <p className="text-slate-500">선택하신 유형에 따라 제공되는 기능이 달라집니다.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
          <button onClick={() => handleRoleSelect('director')} className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden">
            <div className="z-10">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
                <StarIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">원장님 / 대표 강사</h3>
                <span className="inline-block mt-1 text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">관리자 권한 (결제/운영)</span>
              </div>
              <p className="text-slate-500 mt-3 text-sm break-keep leading-relaxed">"제가 직접 결제하고 운영합니다."<br/>학원 전체를 관리하거나, 조교/팀원을 등록하여 나만의 컨텐츠 팀을 운영하실 분</p>
            </div>
          </button>
          <button onClick={() => handleRoleSelect('instructor')} className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden">
            <div className="z-10">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                <UserGroupIcon className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">소속 강사 / 조교</h3>
                <span className="inline-block mt-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">팀원 권한 (초대 기반)</span>
              </div>
              <p className="text-slate-500 mt-3 text-sm break-keep leading-relaxed">"이미 서비스를 이용중인 곳에 합류합니다."<br/>원장님이나 대표 강사님께 초대받아 수업 자료를 이용하고 학생을 관리하실 분</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // Step 2: 정보 입력 폼
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isStudent ? 'bg-emerald-50/30' : 'bg-slate-50'}`}>
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="flex justify-center mb-6">
          <Image src="/images/logo.png" alt="RuleMakers" width={180} height={50} className="h-12 w-auto object-contain" priority />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">기본 정보 설정</h1>
        <p className="text-slate-500">
          {isDirector ? "학원(팀) 운영을 위한 정보를 입력해주세요." : "원활한 서비스 이용을 위해 정보를 입력해주세요."}
        </p>
      </div>

      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700">이름 <span className="text-red-500">*</span></label>
            <div className="relative">
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={name} 
                onChange={handleNameChange}
                required 
                placeholder="실명을 입력해주세요"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" 
              />
            </div>
          </div>

          {/* 휴대폰 인증 섹션 */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700">
              휴대폰 번호 (본인 인증) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DevicePhoneMobileIcon 
                  className={`w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
                    isPhoneVerified ? "text-green-600" : "text-slate-400"
                  }`} 
                />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={handlePhoneChange} 
                  disabled={isPhoneVerified || !!verificationId || isSendingSms}
                  className={`w-full pl-10 pr-4 py-3 border rounded-xl outline-none transition-all duration-300 ${
                    isPhoneVerified 
                      ? "bg-green-50 border-green-500 text-green-700 font-bold shadow-sm disabled:bg-green-50 disabled:text-green-700 disabled:border-green-500 disabled:opacity-100" 
                      : "bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-200"
                  } disabled:cursor-not-allowed`}
                  placeholder="01012345678 (숫자만 입력)"
                />
                
                {isPhoneVerified && (
                  <CheckCircleIcon className="w-6 h-6 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-300" />
                )}
              </div>

              <button 
                type="button"
                onClick={sendVerificationCode}
                disabled={isPhoneVerified || !!verificationId || isSendingSms}
                className={`w-28 flex items-center justify-center font-bold rounded-xl text-sm transition-all duration-300 ${
                  isPhoneVerified 
                    ? "bg-green-500 border border-green-500 text-white cursor-default ring-2 ring-green-200 ring-offset-1" 
                    : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md"
                } disabled:opacity-70 disabled:shadow-none`}
              >
                {isSendingSms ? <Spinner /> : (
                  isPhoneVerified ? (
                    <span className="flex items-center gap-1">
                      <CheckCircleIcon className="w-4 h-4" />
                      완료됨
                    </span>
                  ) : "인증요청"
                )}
              </button>
            </div>
            
            {verificationId && !isPhoneVerified && (
              <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 pr-12 text-lg tracking-widest text-center" 
                    placeholder="인증번호 6자리"
                    maxLength={6}
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-red-500 font-bold font-mono">
                    {formatTime(timer)}
                  </span>
                </div>
                
                <button 
                  type="button"
                  onClick={verifyCode}
                  disabled={timer === 0 || isVerifying}
                  className={`w-24 flex items-center justify-center px-4 py-2 font-bold rounded-xl text-sm text-white transition-colors ${
                    timer > 0 && !isVerifying 
                      ? "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg" 
                      : "bg-slate-300 cursor-not-allowed"
                  }`}
                >
                  {isVerifying ? <Spinner /> : "확인"}
                </button>
              </div>
            )}
            
            {verificationId && !isPhoneVerified && timer === 0 && (
              <div className="flex items-center gap-2 mt-1">
                 <p className="text-xs text-red-500">인증 시간이 만료되었습니다.</p>
                 <button 
                   type="button" 
                   onClick={sendVerificationCode}
                   disabled={isSendingSms}
                   className="text-xs text-slate-500 underline hover:text-slate-800"
                 >
                   {isSendingSms ? "전송 중..." : "인증번호 재전송"}
                 </button>
              </div>
            )}

            <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
          </div>

          {!isStudent && (
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700">
                {isDirector ? "운영 중인 학원/팀 명" : "소속 학원/팀 명"} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={academy} 
                  onChange={handleAcademyChange}
                  required 
                  placeholder={isDirector ? "예: 샤인학원, 김철수 화학팀" : "재직 중인 곳의 이름을 입력하세요"}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" 
                />
              </div>
              {isDirector && (
                <p className="text-xs text-slate-400 mt-1 pl-1">* 추후 사업자 증빙 시 사용할 이름과 동일하게 입력해주세요.</p>
              )}
            </div>
          )}

          {isStudent && (
            <>
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700">학교 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <BuildingOffice2Icon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text" 
                    value={school} 
                    onChange={handleSchoolChange}
                    required 
                    placeholder="재학 중인 학교명"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-700">학년</label>
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="1">고1</option><option value="2">고2</option><option value="3">고3</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-bold text-slate-700">학습 단원</label>
                  <select value={targetUnit} onChange={(e) => setTargetUnit(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none">
                    <option value="">선택</option>
                    {integratedScienceUnits.slice(0,6).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* ▼▼▼ [신규] 약관 동의 섹션 추가 ▼▼▼ */}
          <div className="pt-4 mt-6 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <DocumentTextIcon className="w-4 h-4 text-blue-600" />
              약관 동의
            </h3>
            
            <div className="space-y-3">
              {/* 전체 동의 */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200">
                <input 
                  type="checkbox"
                  checked={agreements.terms && agreements.privacy && agreements.marketing}
                  onChange={(e) => handleAllAgree(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-bold text-slate-800">모두 동의합니다</span>
              </label>

              {/* 개별 동의 항목들 */}
              <div className="space-y-2 px-1">
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" id="agree-terms"
                    checked={agreements.terms}
                    onChange={() => handleSingleAgree('terms')}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="agree-terms" className="text-xs text-slate-600 cursor-pointer select-none leading-relaxed">
                    <span className="text-blue-600 font-bold">[필수]</span> 서비스 이용약관 동의
                    <a href="/terms" target="_blank" className="ml-1 text-slate-400 underline hover:text-slate-600" onClick={(e)=>e.stopPropagation()}>(보기)</a>
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" id="agree-privacy"
                    checked={agreements.privacy}
                    onChange={() => handleSingleAgree('privacy')}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="agree-privacy" className="text-xs text-slate-600 cursor-pointer select-none leading-relaxed">
                    <span className="text-blue-600 font-bold">[필수]</span> 개인정보 수집 및 이용 동의
                    <a href="/privacy" target="_blank" className="ml-1 text-slate-400 underline hover:text-slate-600" onClick={(e)=>e.stopPropagation()}>(보기)</a>
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" id="agree-marketing"
                    checked={agreements.marketing}
                    onChange={() => handleSingleAgree('marketing')}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="agree-marketing" className="text-xs text-slate-600 cursor-pointer select-none leading-relaxed">
                    <span className="text-slate-500 font-bold">[선택]</span> 마케팅 정보 수신 동의 (이벤트/혜택 알림)
                  </label>
                </div>
              </div>
            </div>
          </div>
          {/* ▲▲▲ [신규] 약관 동의 섹션 끝 ▲▲▲ */}

          {/* 하단 버튼 섹션 */}
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button 
              type="submit" 
              // [수정] 필수 약관 미동의 시 버튼 비활성화 로직 추가
              disabled={isSubmitting || !isPhoneVerified || !agreements.terms || !agreements.privacy} 
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-bold text-lg transition-all duration-300 transform ${
                isSubmitting || !isPhoneVerified || !agreements.terms || !agreements.privacy
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-slate-800 hover:scale-[1.02] shadow-lg hover:shadow-xl shadow-slate-200'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  <span>가입 처리 중...</span>
                </>
              ) : (
                <>
                  {/* 버튼 텍스트 조건부 변경 */}
                  {!isPhoneVerified ? "휴대폰 인증을 진행해주세요" : 
                   (!agreements.terms || !agreements.privacy) ? "필수 약관에 동의해주세요" :
                   "회원가입 완료하기"} 
                  {(isPhoneVerified && agreements.terms && agreements.privacy) && <ArrowRightIcon className="w-5 h-5 animate-pulse" />} 
                </>
              )}
            </button>
            <button type="button" onClick={handleResetRole} disabled={isSubmitting} className="w-full mt-4 text-xs text-slate-400 hover:text-slate-600 underline">
              유형 다시 선택하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}