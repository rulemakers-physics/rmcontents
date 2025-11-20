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
import { Bars3Icon, XMarkIcon, ChevronDownIcon } from "@heroicons/react/24/outline";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  // 모바일 메뉴 토글 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 알림 상태 관리
  const [unreadDashboard, setUnreadDashboard] = useState(0); // 강사용
  const [unreadActive, setUnreadActive] = useState(0);       // 관리자용 (접수/진행중)
  const [unreadCompleted, setUnreadCompleted] = useState(0); // 관리자용 (완료/반려)

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      setIsMenuOpen(false);
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };
  
  const handleMenuClick = (href: string) => {
    setIsMenuOpen(false);
    router.push(href);
  }

  // 실시간 알림 리스너
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

  // 드롭다운 메뉴 아이템 컴포넌트 (PC용)
  const DropdownMenuItem = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/90 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        
        {/* 로고 */}
        <Link
          href="/"
          className="flex items-center text-2xl font-bold text-gray-900 flex-shrink-0"
          onClick={() => setIsMenuOpen(false)}
        >
          <Image
            src="/favicon.ico"
            alt="RuleMakers 로고"
            width={28}
            height={28}
            className="mr-2"
          />
          <span className="text-xl">RuleMakers</span>
        </Link>

        {/* PC 네비게이션 메뉴 (md 이상에서 보임) */}
        <nav className="hidden md:flex items-center space-x-8">
          
          {/* 1. 회사 소개 */}
          <Link href="/company" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            About Us
          </Link>

          {/* 2. 플랜 소개 (드롭다운) */}
          <div className="relative group">
            <button className="flex items-center text-sm font-medium text-gray-600 group-hover:text-blue-600 outline-none transition-colors cursor-pointer">
              About Plans <ChevronDownIcon className="ml-1 h-4 w-4" />
            </button>
            <div className="absolute left-0 mt-0 w-40 origin-top-left bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              <div className="py-1">
                <DropdownMenuItem href="/basic-service">베이직 플랜</DropdownMenuItem>
                <DropdownMenuItem href="/premium-service">메이커스 플랜</DropdownMenuItem>
              </div>
            </div>
          </div>

          {/* 3. 컨텐츠 샘플 (드롭다운) */}
          <div className="relative group">
            <button className="flex items-center text-sm font-medium text-gray-600 group-hover:text-blue-600 outline-none transition-colors cursor-pointer">
              About Contents <ChevronDownIcon className="ml-1 h-4 w-4" />
            </button>
            <div className="absolute left-0 mt-0 w-56 origin-top-left bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
              <div className="py-1">
                <DropdownMenuItem href="/showcase">전체 보기</DropdownMenuItem>
                <DropdownMenuItem href="/showcase/mock-exam">학교별 실전 모의고사</DropdownMenuItem>
                <DropdownMenuItem href="/showcase/n-set">학교별 내신 대비 N제</DropdownMenuItem>
                <DropdownMenuItem href="/showcase/high-difficulty">고난도 문항모음</DropdownMenuItem>
              </div>
            </div>
          </div>

          {/* 4. 마이 페이지 (로그인 시) */}
          {user && (
            <div className="relative group">
              <button className="flex items-center text-sm font-medium text-gray-600 group-hover:text-blue-600 outline-none transition-colors cursor-pointer">
                My Page <ChevronDownIcon className="ml-1 h-4 w-4" />
                {/* 알림 뱃지 (통합) */}
                {(unreadDashboard > 0 || unreadActive > 0 || unreadCompleted > 0) && (
                  <span className="absolute -top-2 -right-2 flex h-3 w-3 items-center justify-center rounded-full bg-red-500"></span>
                )}
              </button>
              <div className="absolute right-0 mt-0 w-56 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                <div className="py-1">
                  <Link href="/dashboard" className="flex justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-blue-600">
                    대시보드
                    {unreadDashboard > 0 && (
                      <span className="ml-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">
                        {unreadDashboard > 9 ? "9+" : unreadDashboard}
                      </span>
                    )}
                  </Link>
                  <DropdownMenuItem href="/request">작업 요청하기</DropdownMenuItem>
                  <DropdownMenuItem href="/profile/settings">프로필 설정</DropdownMenuItem>
                  
                  {/* 관리자 메뉴 */}
                  {user.isAdmin && (
                    <>
                      <div className="border-t my-1"></div>
                      <Link href="/admin" className="flex justify-between px-4 py-2 text-sm text-red-700 hover:bg-red-50 bg-red-50/50">
                        [관리자] 접수된 작업
                        {unreadActive > 0 && (
                          <span className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white">
                            {unreadActive > 9 ? "9+" : unreadActive}
                          </span>
                        )}
                      </Link>
                      <Link href="/admin/completed" className="flex justify-between px-4 py-2 text-sm text-green-700 hover:bg-green-50 bg-green-50/50">
                        [관리자] 완료된 작업
                        {unreadCompleted > 0 && (
                          <span className="ml-2 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] text-white">
                            {unreadCompleted > 9 ? "9+" : unreadCompleted}
                          </span>
                        )}
                      </Link>
                    </>
                  )}
                  
                  <div className="border-t my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          )}
          <Link href="/contact" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            Contact
          </Link>

          {/* 비로그인 시 로그인 버튼 */}
          {!user && !loading && (
            <Link
              href="/login"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 whitespace-nowrap"
            >
              로그인
            </Link>
          )}
        </nav>

        {/* 모바일 햄버거 버튼 */}
        <div className="md:hidden flex items-center">
          {!user && !loading && (
             <button
                onClick={() => handleMenuClick("/login")}
                className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-blue-700 mr-4"
              >
                로그인
             </button>
          )}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-600 hover:text-blue-600 p-1"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 오버레이 */}
      <div
        className={`md:hidden absolute w-full bg-white/95 backdrop-blur-sm shadow-xl transition-all duration-300 ease-in-out ${
          isMenuOpen ? 'max-h-screen opacity-100 border-t' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="flex flex-col px-6 py-4 space-y-4 overflow-y-auto max-h-[80vh]">
          
          <Link href="/company" onClick={() => setIsMenuOpen(false)} className="text-base font-medium text-gray-800 py-2 border-b border-gray-100">
            회사 소개
          </Link>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">플랜 소개</p>
            <Link href="/basic-service" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">베이직 플랜</Link>
            <Link href="/premium-service" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">메이커스 플랜</Link>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase">컨텐츠 샘플</p>
            <Link href="/showcase" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">전체 보기</Link>
            <Link href="/showcase/mock-exam" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">학교별 실전 모의고사</Link>
            <Link href="/showcase/n-set" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">학교별 내신 대비 N제</Link>
            <Link href="/showcase/high-difficulty" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">고난도 문항모음</Link>
          </div>

          {user && (
            <div className="space-y-2 pt-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase">마이 페이지</p>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1 flex justify-between">
                대시보드
                {unreadDashboard > 0 && <span className="text-red-500 text-xs font-bold">{unreadDashboard}</span>}
              </Link>
              <Link href="/request" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">작업 요청하기</Link>
              <Link href="/profile/settings" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-gray-700 py-1">프로필 설정</Link>
              
              {user.isAdmin && (
                <>
                  <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-red-700 py-1 flex justify-between">
                    [관리자] 접수된 작업
                    {unreadActive > 0 && <span className="text-red-500 text-xs font-bold">{unreadActive}</span>}
                  </Link>
                  <Link href="/admin/completed" onClick={() => setIsMenuOpen(false)} className="block pl-4 text-sm text-green-700 py-1 flex justify-between">
                    [관리자] 완료된 작업
                    {unreadCompleted > 0 && <span className="text-red-500 text-xs font-bold">{unreadCompleted}</span>}
                  </Link>
                </>
              )}
              
              <button onClick={handleLogout} className="block w-full text-left pl-4 text-sm text-red-600 py-2 mt-2 cursor-pointer">
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}