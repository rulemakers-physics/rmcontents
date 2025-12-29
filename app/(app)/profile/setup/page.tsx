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
  ArrowRightIcon, UserGroupIcon, StarIcon, DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";
import { UserRole } from "@/types/user";
import { SCIENCE_UNITS } from "@/types/scienceUnits";

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

// 로딩 스피너 컴포넌트
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
  
  // 로딩 상태들
  const [isSendingSms, setIsSendingSms] = useState(false); // SMS 발송 중
  const [isVerifying, setIsVerifying] = useState(false);   // 인증번호 확인 중
  const [isSubmitting, setIsSubmitting] = useState(false); // 회원가입 처리 중

  const [timer, setTimer] = useState(0); 
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  // --- 2. useEffect 로직 ---

  // [삭제됨] 세션 스토리지 복구 로직 제거 -> 항상 역할 선택부터 시작

  const handleSelectRole = (role: UserRole) => {
    setSelectedRole(role);
    // [삭제됨] 세션 저장 로직 제거
  };

  const handleResetRole = () => {
    setSelectedRole(null);
    // [삭제됨] 세션 삭제 로직 제거
  };

  // 타이머 카운트다운
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

  // 초기화 및 리캡차 설정 (DOM이 변경될 때마다 재설정)
  useEffect(() => {
    if (!auth || !recaptchaContainerRef.current) return;
    
    // 1. 이미 인증된 사용자 상태 복구
    if (user?.phoneNumber) {
      setIsPhoneVerified(true);
      if (!phone) setPhone(user.phoneNumber.replace("+82", "0"));
    }

    // 2. 기존 리캡차 인스턴스가 있다면 삭제 (DOM 불일치 방지)
    const clearRecaptcha = () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          console.warn("Recaptcha clear warning:", e); 
        }
        window.recaptchaVerifier = null;
      }
    };

    clearRecaptcha(); // 마운트 시 일단 초기화

    // 3. 현재 DOM에 새 리캡차 생성
    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        'size': 'invisible', 
        'callback': () => {},
        'expired-callback': () => toast.error("리캡차 인증 만료. 다시 시도해주세요.")
      });
    } catch (e) { 
      console.error("Recaptcha Init Error:", e); 
    }

    // 4. 언마운트 시 정리
    return () => {
      clearRecaptcha();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // --- 3. 핸들러 함수들 ---

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); 
    if (value.length <= 11) { 
      setPhone(value);
    }
  };

  const sendVerificationCode = async () => {
    if (!phone) return toast.error("휴대폰 번호를 입력해주세요.");
    if (phone.length < 10) return toast.error("올바른 휴대폰 번호를 입력해주세요.");
    if (!user) return;

    setIsSendingSms(true); 

    const formattedPhone = phone.startsWith("0") ? "+82" + phone.slice(1) : phone; 

    try {
      // 리캡차 안전장치
      if (!window.recaptchaVerifier && recaptchaContainerRef.current) {
         window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, { 'size': 'invisible' });
      }

      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await linkWithPhoneNumber(user, formattedPhone, appVerifier);
      
      setVerificationId(confirmationResult);
      setTimer(180); 
      toast.success("인증번호가 발송되었습니다.");

    } catch (error: any) {
      console.error("SMS Send Error:", error);
      
      if (error.code === 'auth/provider-already-linked') {
        setIsPhoneVerified(true);
        toast.success("이미 인증이 완료된 계정입니다.");
        setVerificationId(null);
      } else if (error.code === 'auth/credential-already-in-use') {
        toast.error("이미 다른 계정에서 사용 중인 번호입니다.");
      } else if (error.code === 'auth/invalid-app-credential') {
        toast.error("보안 검증 실패. (도메인 등록 확인 필요)");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("요청 횟수 초과. 잠시 후 다시 시도해주세요.");
      } else {
        toast.error(`전송 실패: ${error.message}`);
      }
      
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch(e) {}
        window.recaptchaVerifier = null; 
      }
    } finally {
      setIsSendingSms(false); 
    }
  };

  const verifyCode = async () => {
    if (!verificationId) return;
    if (!otpCode) return toast.error("인증번호를 입력해주세요.");
    if (timer === 0) return toast.error("입력 시간이 만료되었습니다. 재전송해주세요.");

    setIsVerifying(true); 

    try {
      await verificationId.confirm(otpCode);
      setIsPhoneVerified(true);
      toast.success("본인 인증이 완료되었습니다!");
      setVerificationId(null); 
    } catch (error: any) {
      console.error("Verify Error:", error);
      
      if (
        error.code === 'auth/credential-already-in-use' || 
        error.code === 'auth/account-exists-with-different-credential'
      ) {
        toast.error("이미 다른 계정에 등록된 휴대폰 번호입니다.");
      } else if (error.code === 'auth/invalid-verification-code') {
        toast.error("인증번호가 올바르지 않습니다. 다시 확인해주세요.");
      } else if (error.code === 'auth/code-expired') {
        toast.error("인증번호가 만료되었습니다. 재전송해주세요.");
      } else {
        toast.error("인증에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRole) return;

    if (!isPhoneVerified) {
      return toast.error("본인 확인을 위해 휴대폰 인증을 완료해주세요.");
    }
    if (!name.trim()) return toast.error("이름을 입력해주세요.");
    if ((selectedRole === 'director' || selectedRole === 'instructor') && !academy.trim()) return toast.error("소속(학원/팀)명은 필수입니다.");
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
      };

      let additionalData = {};

      if (selectedRole === 'student') {
        additionalData = {
          school: school,
          grade: parseInt(grade),
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
      
      // [삭제됨] 세션 삭제 로직 제거
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
      toast.error("설정 저장 중 오류가 발생했습니다.");
      setIsSubmitting(false); 
    }
  };

  const integratedScienceUnits = SCIENCE_UNITS.flatMap(s => s.majorTopics.map(m => m.name));
  const isStudent = selectedRole === 'student';
  const isDirector = selectedRole === 'director';

  // --- 4. 렌더링 ---
  if (!user) return null;

  // Step 1: 역할 선택 (이제 항상 여기가 먼저 나옵니다)
  if (!selectedRole) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">RuleMakers 이용 목적을 선택해주세요</h1>
          <p className="text-slate-500">선택하신 유형에 따라 제공되는 기능이 달라집니다.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl w-full">
          <button onClick={() => handleSelectRole('director')} className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-purple-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden">
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
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-50 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0" />
          </button>

          <button onClick={() => handleSelectRole('instructor')} className="group relative bg-white p-8 rounded-3xl border-2 border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all text-left flex flex-col h-80 justify-between overflow-hidden">
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
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-50 rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-10 group-hover:translate-y-0" />
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
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="실명을 입력해주세요"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-200" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-bold text-slate-700">
              휴대폰 번호 (본인 인증) <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DevicePhoneMobileIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="tel" 
                  value={phone} 
                  onChange={handlePhoneChange} 
                  disabled={isPhoneVerified || !!verificationId || isSendingSms}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-200 disabled:bg-slate-100"
                  placeholder="01012345678 (숫자만 입력)"
                />
              </div>
              <button 
                type="button"
                onClick={sendVerificationCode}
                disabled={isPhoneVerified || !!verificationId || isSendingSms}
                className={`w-28 flex items-center justify-center font-bold rounded-xl text-white text-sm transition-colors ${
                  isPhoneVerified 
                    ? "bg-green-500 cursor-default" 
                    : "bg-slate-900 hover:bg-slate-800"
                } disabled:bg-slate-300 disabled:cursor-not-allowed`}
              >
                {isSendingSms ? <Spinner /> : (isPhoneVerified ? "인증됨" : "인증요청")}
              </button>
            </div>
            
            {verificationId && !isPhoneVerified && (
              <div className="flex gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                <div className="relative flex-1">
                  <input 
                    type="text" 
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-200 pr-12" 
                    placeholder="인증번호 6자리"
                    maxLength={6}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-red-500 font-medium font-mono">
                    {formatTime(timer)}
                  </span>
                </div>
                
                <button 
                  type="button"
                  onClick={verifyCode}
                  disabled={timer === 0 || isVerifying}
                  className={`w-24 flex items-center justify-center px-4 py-2 font-bold rounded-xl text-sm text-white ${
                    timer > 0 && !isVerifying ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-400 cursor-not-allowed"
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
                  onChange={(e) => setAcademy(e.target.value)} 
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
                    type="text" value={school} onChange={(e) => setSchool(e.target.value)} required placeholder="재학 중인 학교명"
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

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting || !isPhoneVerified} 
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-6 py-4 font-bold shadow-lg transition-all ${
                isSubmitting || !isPhoneVerified 
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  <span>가입 처리 중입니다...</span>
                </>
              ) : (
                <>
                  {isPhoneVerified ? "시작하기" : "휴대폰 인증 필요"} 
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
            <button type="button" onClick={handleResetRole} disabled={isSubmitting} className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 underline">
              유형 다시 선택하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}