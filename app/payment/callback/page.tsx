// app/payment/callback/page.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState("처리 중...");
  
  // 중복 요청 방지를 위한 Ref
  const isProcessing = useRef(false);

  useEffect(() => {
    const processBilling = async () => {
      // 이미 처리 중이라면(true) 함수를 즉시 종료
      if (isProcessing.current) return;
      isProcessing.current = true;

      const authKey = searchParams.get("authKey");
      const customerKey = searchParams.get("customerKey");
      const mode = searchParams.get("mode"); // update 또는 null
      const planName = searchParams.get("plan");
      const isTrialExtensionStr = searchParams.get("isTrialExtension");
      const isTrialExtension = isTrialExtensionStr === "true";

      if (!authKey || !customerKey || !user) {
        setStatus("잘못된 접근입니다.");
        return;
      }

      try {
        // [분기 1] 카드 변경 모드 (mode=update)
        if (mode === "update") {
          setStatus("카드 정보를 변경하고 있습니다...");
          const updateCardFn = httpsCallable(functions, 'updateCard');
          await updateCardFn({ authKey, customerKey });
          
          alert("카드가 성공적으로 변경되었습니다.");
          router.replace("/profile/billing");
        } 
        // [분기 2] 신규/재구독/무료체험연장 처리
        else {
          setStatus("구독 처리를 진행 중입니다...");

          // 백엔드 요청 (무료 체험 연장 여부 isTrialExtension 포함)
          const response = await axios.post(
            "https://asia-east1-rmcontents1.cloudfunctions.net/registerSubscription", 
            { 
              authKey, 
              customerKey,
              planName,
              userId: user.uid,
              isTrialExtension // [중요] 무료 체험 연장 플래그 전달
            }
          );

          if (response.data.status === "SUCCESS") {
            const successMsg = isTrialExtension 
              ? "무료 체험이 연장되었습니다! (결제되지 않음) 🎉" 
              : "구독이 성공적으로 시작되었습니다! 🎉";
            setStatus(successMsg);
            
            setTimeout(() => router.push("/dashboard"), 2000);
          }
        }

      } catch (error: any) {
        console.error("처리 중 에러:", error);
        
        const errorMsg = error.response?.data?.message || error.message || "처리 중 오류가 발생했습니다.";
        setStatus(`오류 발생: ${errorMsg}`);
        
        alert(`처리에 실패했습니다.\n사유: ${errorMsg}`);
        
        // 카드 변경 실패 시에는 빌링 페이지로, 그 외에는 요금제 페이지로 이동
        if (mode === "update") {
          router.replace("/profile/billing");
        } else {
          router.replace("/pricing");
        }
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