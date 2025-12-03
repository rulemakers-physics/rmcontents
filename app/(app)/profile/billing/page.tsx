// app/(app)/profile/billing/page.tsx

"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
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
  PaperClipIcon
} from "@heroicons/react/24/outline";

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
        
        {/* 왼쪽: 구독 정보 */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CreditCardIcon className="w-24 h-24" />
            </div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Current Plan</h3>
            <div className="text-3xl font-extrabold mb-4">{userData?.plan || 'FREE'} Plan</div>
            
            <div className="space-y-3 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-green-400" />
                <span>현재 이용 중인 서비스입니다.</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-blue-400" />
                <span>다음 결제일: 2025. 11. 01</span>
              </div>
            </div>
            <button className="mt-6 w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-colors">
              플랜 업그레이드 / 변경
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5 text-slate-500" /> 결제 내역
            </h3>
            <div className="space-y-4">
              <div className="text-sm text-slate-400 text-center py-4">결제 내역이 없습니다.</div>
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
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-100 rounded-xl text-xs text-yellow-800 leading-relaxed">
            * 입력하신 정보는 결제 증빙 발행 목적으로만 사용됩니다.
          </div>
        </div>
      </div>
    </div>
  );
}