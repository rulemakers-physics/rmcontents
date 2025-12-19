"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      const paymentKey = searchParams.get("paymentKey");
      const orderId = searchParams.get("orderId");
      const amount = searchParams.get("amount");

      if (!paymentKey || !orderId || !amount) {
        alert("결제 정보가 유효하지 않습니다.");
        router.push("/dashboard");
        return;
      }

      try {
        // 백엔드(Firebase Functions) 호출하여 결제 승인 요청
        // 주의: 실제 배포된 Functions URL을 사용해야 합니다.
        const response = await axios.post(
          "https://asia-east1-rmcontents1.cloudfunctions.net/confirmPayment", 
          { paymentKey, orderId, amount }
        );

        if (response.data.status === "DONE") {
          alert("결제가 성공적으로 완료되었습니다!");
          router.push("/dashboard"); // 결제 후 대시보드로 이동
        }
      } catch (error) {
        console.error(error);
        alert("결제 승인 중 오류가 발생했습니다.");
        // 실패 시 처리 로직
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="flex h-screen items-center justify-center">
      {isVerifying ? (
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 rounded-full border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg font-bold text-slate-700">결제 승인 처리 중입니다...</p>
          <p className="text-sm text-slate-500">잠시만 기다려주세요. (창을 닫지 마세요)</p>
        </div>
      ) : (
        <div>처리 완료</div>
      )}
    </div>
  );
}