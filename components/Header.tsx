// components/Header.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image"; 
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // [신규] 알림 상태 관리
  const [unreadDashboard, setUnreadDashboard] = useState(0); // 강사용
  const [unreadActive, setUnreadActive] = useState(0);       // 관리자용 (접수/진행중)
  const [unreadCompleted, setUnreadCompleted] = useState(0); // 관리자용 (완료/반려)

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/"); 
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // [신규] 실시간 알림 리스너
  useEffect(() => {
    if (loading || !user) return;

    // 1. 강사인 경우: 내 요청 중 강사용 안 읽은 메시지가 있는 것 카운트
    if (!user.isAdmin) {
      const q = query(
        collection(db, "requests"),
        where("instructorId", "==", user.uid),
        where("unreadCountInstructor", ">", 0)
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUnreadDashboard(snapshot.size);
      });
      return () => unsubscribe();
    }

    // 2. 관리자인 경우: 관리자용 안 읽은 메시지가 있는 모든 요청 가져와서 분류
    if (user.isAdmin) {
      const q = query(
        collection(db, "requests"),
        where("unreadCountAdmin", ">", 0)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        let activeCount = 0;
        let completedCount = 0;

        snapshot.forEach((doc) => {
          const status = doc.data().status;
          if (status === "requested" || status === "in_progress") {
            activeCount++;
          } else if (status === "completed" || status === "rejected") {
            completedCount++;
          }
        });

        setUnreadActive(activeCount);
        setUnreadCompleted(completedCount);
      });
      return () => unsubscribe();
    }
  }, [user, loading]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center text-2xl font-bold text-gray-900"
        >
          <Image
            src="/favicon.ico" 
            alt="RuleMakers 로고"
            width={28} 
            height={28} 
            className="mr-2" 
          />
          <span>RuleMakers</span>
        </Link>

        {/* 네비게이션 메뉴 */}
        <nav className="flex items-center space-x-6">
          <Link
            href="/basic-service"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            베이직 서비스
          </Link>
          <Link
            href="/premium-service"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            프리미엄 서비스
          </Link>

          <Link
            href="/showcase"
            className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
          >
            컨텐츠 샘플
          </Link>

          {!loading && (
            <>
              {!user && (
                <button
                  onClick={() => router.push("/login")}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  로그인
                </button>
              )}

              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="relative text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
                  >
                    대시보드
                    {/* [신규] 강사용 알림 배지 */}
                    {unreadDashboard > 0 && (
                      <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {unreadDashboard > 9 ? "9+" : unreadDashboard}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/request"
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-blue-600"
                  >
                    작업 요청하기
                  </Link>
                  
                  {/* 관리자 전용 메뉴 */}
                  {user.isAdmin && (
                    <>
                      <Link
                        href="/admin/completed"
                        className="relative rounded-md bg-green-100 px-3 py-1 text-sm font-medium text-green-700 transition-colors hover:bg-green-200"
                      >
                        [완료된 작업]
                        {/* [신규] 관리자 완료 알림 배지 */}
                        {unreadCompleted > 0 && (
                          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {unreadCompleted > 9 ? "9+" : unreadCompleted}
                          </span>
                        )}
                      </Link>
                      <Link
                        href="/admin"
                        className="relative rounded-md bg-red-100 px-3 py-1 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                      >
                        [접수된 작업]
                        {/* [신규] 관리자 접수 알림 배지 */}
                        {unreadActive > 0 && (
                          <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                            {unreadActive > 9 ? "9+" : unreadActive}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="text-sm font-medium text-gray-600 transition-colors hover:text-red-600"
                  >
                    로그아웃
                  </button>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}