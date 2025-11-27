"use client";

import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { CheckIcon } from "@heroicons/react/24/solid";

export default function PricingPage() {
  const { user, userData } = useAuth();

  // [가상 결제 함수] 실제 결제 연동 전, DB만 업데이트
  const handleUpgrade = async (plan: 'BASIC' | 'MAKERS') => {
    if (!user) return alert("로그인이 필요합니다.");
    
    const confirmMsg = plan === 'MAKERS' 
      ? "메이커스 플랜으로 업그레이드 하시겠습니까? (테스트: 즉시 반영)" 
      : "베이직 플랜을 선택하시겠습니까?";

    if (confirm(confirmMsg)) {
      try {
        await updateDoc(doc(db, "users", user.uid), {
          plan: plan,
          updatedAt: new Date(),
          // 메이커스는 코인 3개 지급 등의 로직
          coins: plan === 'MAKERS' ? 3 : 0 
        });
        alert(`${plan} 플랜이 적용되었습니다!`);
        window.location.reload();
      } catch (e) {
        console.error(e);
        alert("오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="py-24 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 max-w-5xl">
        <h1 className="text-3xl font-bold text-center mb-12">요금제 선택</h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          {/* Basic Plan */}
          <div className={`p-8 rounded-2xl bg-white border-2 ${userData?.plan === 'BASIC' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
            <h3 className="text-xl font-bold">Basic Plan</h3>
            <p className="text-3xl font-bold mt-4">월 99,000원</p>
            <button 
              onClick={() => handleUpgrade('BASIC')}
              className="w-full mt-6 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold text-gray-800 transition-colors"
            >
              {userData?.plan === 'BASIC' ? '이용 중' : '선택하기'}
            </button>
          </div>

          {/* Maker's Plan */}
          <div className={`p-8 rounded-2xl bg-slate-900 text-white border-2 ${userData?.plan === 'MAKERS' ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent'}`}>
            <h3 className="text-xl font-bold text-blue-400">Maker's Plan</h3>
            <p className="text-3xl font-bold mt-4">별도 문의</p>
            <ul className="mt-6 space-y-3 text-sm text-gray-300">
               <li className="flex gap-2"><CheckIcon className="w-5 h-5 text-blue-500"/> 킬러 문항 무제한 사용</li>
               <li className="flex gap-2"><CheckIcon className="w-5 h-5 text-blue-500"/> 1:1 맞춤 제작 요청 가능</li>
            </ul>
            <button 
              onClick={() => handleUpgrade('MAKERS')}
              className="w-full mt-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 font-bold text-white transition-colors"
            >
              {userData?.plan === 'MAKERS' ? '이용 중' : '업그레이드'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}