"use client";

import { useEffect, useState, useRef } from "react"; // useRef 추가
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState("카드 정보를 확인하고 있습니다...");
  
  // [핵심] 중복 요청 방지를 위한 Ref
  // useRef는 컴포넌트가 다시 렌더링되어도 값이 유지됩니다.
  const isProcessing = useRef(false);

  useEffect(() => {
    const processBilling = async () => {
      // 이미 처리 중이라면(true) 함수를 즉시 종료 (중복 실행 방지)
      if (isProcessing.current) return;

      const authKey = searchParams.get("authKey");
      const customerKey = searchParams.get("customerKey");
      const planName = searchParams.get("plan");

      if (!authKey || !customerKey || !user) {
        setStatus("잘못된 접근입니다.");
        return;
      }

      // 처리 시작 플래그 세우기
      isProcessing.current = true;

      try {
        setStatus("카드 등록 및 첫 결제 진행 중...");

        // 백엔드 요청
        const response = await axios.post(
          "https://asia-east1-rmcontents1.cloudfunctions.net/registerSubscription", 
          { 
            authKey, 
            customerKey,
            planName,
            userId: user.uid 
          }
        );

        if (response.data.status === "SUCCESS") {
          setStatus("구독이 성공적으로 시작되었습니다! 🎉");
          setTimeout(() => router.push("/dashboard"), 2000);
        }
      } catch (error: any) {
        console.error("결제 에러:", error);
        
        // 백엔드에서 보내준 구체적인 에러 메시지 확인
        const errorMsg = error.response?.data?.message || "결제 승인 중 오류가 발생했습니다.";
        setStatus(`오류 발생: ${errorMsg}`);
        
        alert(`결제 처리에 실패했습니다.\n사유: ${errorMsg}`);
        router.push("/pricing");
        
        // (선택사항) 실패 시 재시도 허용하려면 아래 주석 해제
        // isProcessing.current = false; 
      }
    };

    processBilling();
  }, [searchParams, user, router]);

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-lg font-medium text-slate-700">{status}</p>
    </div>
  );
}