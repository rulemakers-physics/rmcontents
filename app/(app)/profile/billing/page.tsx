// app/(app)/profile/billing/page.tsx

"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc, collection, query, where, orderBy, getDocs } from "firebase/firestore"; // [수정] collection, query 등 추가
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import { 
  CreditCardIcon, 
  DocumentTextIcon, 
  BuildingLibraryIcon,
  CheckCircleIcon,
  ClockIcon,
  CloudArrowUpIcon,
  PaperClipIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { loadTossPayments } from "@tosspayments/payment-sdk"; // 추가 필요
import { httpsCallable } from "firebase/functions"; // 추가 필요
import { functions } from "@/lib/firebase"; // functions 인스턴스 import 가정

// [신규] 결제 내역 타입 정의
interface PaymentData {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  method: string;
  approvedAt: string; // ISO string
  orderName?: string;
}

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export default function BillingPage() {
  const { user, userData, loading } = useAuth();
  
  // 상태 표시용 변수
  const verificationStatus = userData?.businessInfo?.verificationStatus || 'none';

  // 탭 상태: 'business'(사업자) | 'personal'(개인)
  const [taxType, setTaxType] = useState<'business' | 'personal'>('business');

  // 공통 폼
  const [representative, setRepresentative] = useState(""); // 대표자명/성명
  const [address, setAddress] = useState("");
  const [taxEmail, setTaxEmail] = useState("");

  // 사업자용 폼
  const [companyName, setCompanyName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [businessItem, setBusinessItem] = useState("");
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState("");
  const [existingFileName, setExistingFileName] = useState("");

  // [수정] 개인용 폼 (주민번호 -> 휴대폰 번호)
  const [cashReceiptNumber, setCashReceiptNumber] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // [신규] 결제 내역 상태
  const [paymentHistory, setPaymentHistory] = useState<PaymentData[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // 초기 데이터 로드 (유저 정보 + 결제 내역)
  useEffect(() => {
    if (userData?.businessInfo) {
      const info = userData.businessInfo;
      setTaxType(info.taxType || 'business');
      setRepresentative(info.representative || "");
      setAddress(info.address || "");
      setTaxEmail(info.taxEmail || "");
      
      setCompanyName(info.companyName || "");
      setRegistrationNumber(info.registrationNumber || "");
      setBusinessType(info.businessType || "");
      setBusinessItem(info.businessItem || "");
      setExistingFileUrl(info.licenseFileUrl || "");
      setExistingFileName(info.licenseFileName || "");

      setCashReceiptNumber(info.cashReceiptNumber || "");
    }
  }, [userData]);

  // [신규] 결제 내역 불러오기
  useEffect(() => {
    const fetchPayments = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, "payments"),
          where("userId", "==", user.uid),
          orderBy("approvedAt", "desc") // 최신순 정렬
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentData));
        setPaymentHistory(list);
      } catch (e) {
        console.error("결제 내역 로딩 실패", e);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    fetchPayments();
  }, [user]);

  // 초기 데이터 로드
  useEffect(() => {
    if (userData?.businessInfo) {
      const info = userData.businessInfo;
      setTaxType(info.taxType || 'business');
      setRepresentative(info.representative || "");
      setAddress(info.address || "");
      setTaxEmail(info.taxEmail || "");
      
      // 사업자 정보
      setCompanyName(info.companyName || "");
      setRegistrationNumber(info.registrationNumber || "");
      setBusinessType(info.businessType || "");
      setBusinessItem(info.businessItem || "");
      setExistingFileUrl(info.licenseFileUrl || "");
      setExistingFileName(info.licenseFileName || "");

      // [수정] 개인 정보 로드
      setCashReceiptNumber(info.cashReceiptNumber || "");
    }
  }, [userData]);

  // [신규] 날짜 및 D-Day 계산 로직
  const getPaymentInfo = () => {
    if (!userData?.nextPaymentDate) return null;
    
    const nextDate = userData.nextPaymentDate.toDate();
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 남은 일수 올림

    return {
      dateString: nextDate.toLocaleDateString("ko-KR", { year: 'numeric', month: '2-digit', day: '2-digit' }),
      daysLeft: diffDays > 0 ? diffDays : 0
    };
  };

  const paymentInfo = getPaymentInfo();
  const isTrial = userData?.subscriptionStatus === 'TRIAL';

  // 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLicenseFile(e.target.files[0]);
    }
  };

  // 저장 핸들러
  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 유효성 검사
    if (!representative || !address || !taxEmail) {
      toast.error("필수 정보를 모두 입력해주세요.");
      return;
    }
    if (taxType === 'business' && (!companyName || !registrationNumber)) {
      toast.error("상호명과 사업자번호는 필수입니다.");
      return;
    }
    // [수정] 주민번호 대신 휴대폰 번호 체크
    if (taxType === 'personal' && !cashReceiptNumber) {
      toast.error("현금영수증용 번호는 필수입니다.");
      return;
    }

    setIsSaving(true);
    try {
      let fileUrl = existingFileUrl;
      let fileName = existingFileName;

      // 파일 업로드 (새 파일이 있을 경우)
      if (licenseFile) {
        const uniqueName = `${uuidv4()}_${licenseFile.name}`;
        const storageRef = ref(storage, `business_licenses/${user.uid}/${uniqueName}`);
        await uploadBytes(storageRef, licenseFile);
        fileUrl = await getDownloadURL(storageRef);
        fileName = licenseFile.name;
      }

      // DB 저장용 데이터 구성
      const businessInfoData = {
        taxType,
        representative,
        address,
        taxEmail,
        // 타입에 따라 필요한 정보만 저장 (나머지는 빈값 처리)
        ...(taxType === 'business' ? {
          companyName,
          registrationNumber,
          businessType,
          businessItem,
          licenseFileUrl: fileUrl,
          licenseFileName: fileName,
          cashReceiptNumber: "" // 초기화
        } : {
          companyName: "",
          registrationNumber: "",
          businessType: "",
          businessItem: "",
          licenseFileUrl: "",
          licenseFileName: "",
          cashReceiptNumber // [수정] 저장
        }),

        // 파일이 새로 업로드되었다면 상태를 'pending'으로 리셋 (개인은 자동 승인 또는 별도 검수)
        verificationStatus: licenseFile ? 'pending' : (userData?.businessInfo?.verificationStatus || 'none'),
      };

      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        businessInfo: businessInfoData
      });

      toast.success("발행 정보가 저장되었습니다.");
      
      // 파일 업로드 후 상태 업데이트
      if (licenseFile) {
        setExistingFileUrl(fileUrl);
        setExistingFileName(fileName);
        setLicenseFile(null);
      }

    } catch (error) {
      console.error(error);
      toast.error("저장에 실패했습니다.");
    }
    setIsSaving(false);
  };

  // [신규] 카드 변경 핸들러
  const handleChangeCard = async () => {
    try {
      const tossPayments = await loadTossPayments(CLIENT_KEY);
      // '카드 변경' 모드로 빌링키 발급 요청 -> Success URL에서 처리
      await tossPayments.requestBillingAuth("카드", {
        customerKey: user!.uid,
        successUrl: `${window.location.origin}/payment/callback?mode=update`, // mode=update 파라미터 추가
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  // [신규] 구독 해지 핸들러
  const handleCancelSubscription = async () => {
    if (!confirm("정말 해지하시겠습니까?\n다음 결제일 전까지만 이용 가능합니다.")) return;
    
    try {
      const cancelFn = httpsCallable(functions, 'cancelSubscription');
      await cancelFn();
      toast.success("해지 예약되었습니다. 다음 결제일에 결제되지 않습니다.");
      window.location.reload(); // 상태 갱신
    } catch (e) {
      toast.error("해지 처리에 실패했습니다.");
    }
  };

  if (loading) return <div className="p-10 text-center">로딩 중...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">결제 및 세금계산서 관리</h1>
          <p className="text-slate-500 mt-1">구독 상태를 확인하고 세금계산서 발행 정보를 관리하세요.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* [수정] 왼쪽: 구독 정보 카드 */}
        <div className="lg:col-span-1 space-y-6">
          <div className={`p-6 rounded-2xl shadow-lg relative overflow-hidden text-white ${
            userData?.subscriptionStatus === 'PAYMENT_FAILED' ? 'bg-red-900' : 
            userData?.subscriptionStatus === 'SCHEDULED_CANCEL' ? 'bg-slate-700' :
            'bg-slate-900'
          }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCardIcon className="w-24 h-24" />
            </div>
            
            {/* 상단 뱃지 (체험 중 / 활성 / 해지예약) */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Current Plan</h3>
              {isTrial && <span className="text-[10px] bg-indigo-500 px-2 py-0.5 rounded-full font-bold">무료 체험 중</span>}
              {userData?.subscriptionStatus === 'SCHEDULED_CANCEL' && <span className="text-[10px] bg-orange-500 px-2 py-0.5 rounded-full font-bold">해지 예약됨</span>}
            </div>

            <div className="text-3xl font-extrabold mb-6">
              {userData?.plan || 'FREE'} Plan
            </div>
            
            <div className="space-y-4 text-sm text-slate-300">
              
              {/* 결제일 정보 표시 */}
              {paymentInfo ? (
                <>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-5 h-5 text-blue-400" />
                    <span>
                      {userData?.subscriptionStatus === 'SCHEDULED_CANCEL' ? '이용 종료일' : '다음 결제일'}: 
                      <strong className="text-white ml-1">{paymentInfo.dateString}</strong>
                    </span>
                  </div>
                  
                  {/* 무료 체험 기간 카운트다운 */}
                  {isTrial && (
                    <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                      <p className="text-xs text-indigo-300 font-bold mb-1">FREE TRIAL</p>
                      <p className="text-white">
                        무료 체험 종료까지 <span className="text-yellow-400 font-bold text-lg">{paymentInfo.daysLeft}일</span> 남았습니다.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-slate-500" />
                  <span>예정된 결제가 없습니다.</span>
                </div>
              )}

              {userData?.subscriptionStatus === 'ACTIVE' && !isTrial && (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <span>정상 이용 중입니다.</span>
                </div>
              )}
            </div>

            {/* 하단 버튼 영역 (해지 상태 등 반영) */}
            <div className="mt-6 flex flex-col gap-2">
              {/* 상태 메시지 및 버튼 */}
              {userData?.subscriptionStatus === 'PAYMENT_FAILED' && (
                 <div className="text-xs text-red-300 bg-red-950/50 p-2 rounded mb-2 border border-red-800">
                   ❗ 결제 실패: 카드를 변경해주세요.
                 </div>
              )}
              
              <div className="flex gap-2">
                <button 
                  onClick={handleChangeCard}
                  className="flex-1 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors text-xs"
                >
                  카드 변경
                </button>
                
                {/* 해지 버튼: ACTIVE, TRIAL, FAILED 상태일 때만 노출 (이미 해지했거나 FREE면 숨김) */}
                {['ACTIVE', 'TRIAL', 'PAYMENT_FAILED'].includes(userData?.subscriptionStatus || '') && (
                  <button 
                    onClick={handleCancelSubscription}
                    className="flex-1 py-3 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors text-xs"
                  >
                    구독 해지
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* [수정] 결제 내역 표시 영역 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-h-[400px] overflow-y-auto custom-scrollbar">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-slate-500" /> 결제 내역
            </h3>
            <div className="space-y-3">
              {isLoadingHistory ? (
                <div className="text-center py-4 text-sm text-slate-400">불러오는 중...</div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-4">결제 내역이 없습니다.</div>
              ) : (
                paymentHistory.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <div>
                      <div className="text-xs text-slate-400 mb-0.5">
                        {new Date(payment.approvedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm font-bold text-slate-800">
                        {payment.status === 'DONE' ? '결제 완료' : '결제 실패'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600">
                        {payment.amount.toLocaleString()}원
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {payment.method === 'BILLING' ? '첫 결제' : '정기 결제'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 세금계산서 정보 입력 폼 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BuildingLibraryIcon className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800">증빙 자료 발행 정보</h3>
              </div>
              <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                매월 10일 자동 발행
              </span>
            </div>
            
            <div className="p-6 md:p-8">
              {/* 검수 상태 배지 */}
              <div className="flex items-center gap-2 mb-6">
                <span className="font-bold text-slate-700 text-sm">검수 상태:</span>
                {verificationStatus === 'pending' && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold animate-pulse">검수 대기 중</span>}
                {verificationStatus === 'verified' && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">인증 완료</span>}
                {verificationStatus === 'rejected' && <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">반려됨 (사유 확인 필요)</span>}
                {verificationStatus === 'none' && <span className="text-xs text-slate-400 font-medium">증빙 서류 미등록</span>}
              </div>

              {/* 탭 선택 */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6 w-full md:w-auto self-start">
                <button
                  onClick={() => setTaxType('business')}
                  className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    taxType === 'business' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  사업자 (세금계산서)
                </button>
                <button
                  onClick={() => setTaxType('personal')}
                  className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                    taxType === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  개인 (소득공제)
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-6">
                
                {/* === 사업자 전용 필드 === */}
                {taxType === 'business' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">상호명 (법인/단체명) <span className="text-red-500">*</span></label>
                      <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="사업자등록증상의 상호명" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">대표자명 <span className="text-red-500">*</span></label>
                      <input type="text" value={representative} onChange={(e) => setRepresentative(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="대표자 성함" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">사업자등록번호 <span className="text-red-500">*</span></label>
                      <input type="text" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="000-00-00000" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">계산서 수신 이메일 <span className="text-red-500">*</span></label>
                      <input type="email" value={taxEmail} onChange={(e) => setTaxEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="email@example.com" required />
                    </div>
                    
                    {/* 사업자등록증 파일 업로드 */}
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-slate-700">사업자등록증 첨부 <span className="text-blue-500 text-xs font-normal">(검수용)</span></label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors text-sm font-medium text-slate-600">
                          <CloudArrowUpIcon className="w-5 h-5" /> 파일 선택
                          <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
                        </label>
                        <span className="text-xs text-slate-500 truncate max-w-[200px]">
                          {licenseFile ? licenseFile.name : (existingFileName || "선택된 파일 없음")}
                        </span>
                        {existingFileUrl && !licenseFile && (
                          <a href={existingFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <PaperClipIcon className="w-3 h-3" /> 기존 파일 보기
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2 grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">업태</label>
                        <input type="text" value={businessType} onChange={(e) => setBusinessType(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="예: 교육서비스업" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">종목</label>
                        <input type="text" value={businessItem} onChange={(e) => setBusinessItem(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="예: 입시학원" />
                      </div>
                    </div>
                  </div>
                )}

                {/* === [수정] 개인 전용 필드 (휴대폰 번호) === */}
                {taxType === 'personal' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">성명 <span className="text-red-500">*</span></label>
                      <input type="text" value={representative} onChange={(e) => setRepresentative(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="실명을 입력하세요" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">현금영수증 번호 (휴대폰) <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={cashReceiptNumber} 
                        onChange={(e) => setCashReceiptNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" 
                        placeholder="010-0000-0000" 
                        required 
                      />
                      <p className="text-[10px] text-slate-400">* 소득공제용 현금영수증 발행을 위해 사용됩니다.</p>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">이메일 <span className="text-red-500">*</span></label>
                      <input type="email" value={taxEmail} onChange={(e) => setTaxEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="영수증 수신 이메일" required />
                    </div>
                  </div>
                )}

                {/* 공통 주소 필드 */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">주소지 <span className="text-red-500">*</span></label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none" placeholder="상세 주소를 입력하세요" required />
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-end">
                  <button type="submit" disabled={isSaving}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSaving ? "저장 중..." : "정보 저장하기"}
                  </button>
                </div>
              </form>
            </div>
            {/* [수정] 상태별 메시지 표시 */}
            {userData?.subscriptionStatus === 'PAYMENT_FAILED' && (
               <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg text-sm text-red-200 mb-4 flex items-center gap-2">
                 <ExclamationTriangleIcon className="w-5 h-5" />
                 <span>결제에 실패했습니다. 카드를 변경해주세요.</span>
               </div>
            )}
            
            {userData?.subscriptionStatus === 'SCHEDULED_CANCEL' && (
               <div className="bg-orange-500/20 border border-orange-500/50 p-3 rounded-lg text-sm text-orange-200 mb-4">
                 <span>해지 예약 상태입니다. ({userData.nextPaymentDate?.toDate().toLocaleDateString()} 종료)</span>
               </div>
            )}
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 leading-relaxed">
            * 입력하신 정보는 결제 증빙 발행 목적으로만 사용됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}