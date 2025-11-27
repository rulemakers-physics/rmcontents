"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from "@heroicons/react/24/outline";

// 새로 만든 알림 벨 컴포넌트 (파일이 있다면 import)
import NotificationBell from "./NotificationBell";

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // UI 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- [보존] 기존 알림 배지 로직 ---
  const [unreadDashboard, setUnreadDashboard] = useState(0); // 강사용
  const [unreadActive, setUnreadActive] = useState(0);       // 관리자용 (접수/진행)
  const [unreadCompleted, setUnreadCompleted] = useState(0); // 관리자용 (완료/반려)

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- [보존] Firestore 실시간 리스너 ---
  useEffect(() => {
    if (!user) return;

    // 1. 관리자용: 전체 요청 상태 감시
    if (user.isAdmin) {
      // (1) 접수됨 + 진행중
      const qActive = query(
        collection(db, "requests"),
        where("status", "in", ["requested", "in_progress"])
      );
      const unsubActive = onSnapshot(qActive, (snapshot) => {
        let count = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.unreadCountAdmin && data.unreadCountAdmin > 0) {
            count += data.unreadCountAdmin;
          }
        });
        setUnreadActive(count);
      });

      // (2) 완료됨 + 반려됨
      const qCompleted = query(
        collection(db, "requests"),
        where("status", "in", ["completed", "rejected"])
      );
      const unsubCompleted = onSnapshot(qCompleted, (snapshot) => {
        let count = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.unreadCountAdmin && data.unreadCountAdmin > 0) {
            count += data.unreadCountAdmin;
          }
        });
        setUnreadCompleted(count);
      });

      return () => {
        unsubActive();
        unsubCompleted();
      };
    } else {
      // 2. 강사용: 내 요청의 안 읽은 메시지
      const qInstructor = query(
        collection(db, "requests"),
        where("instructorId", "==", user.uid)
      );
      const unsubscribe = onSnapshot(qInstructor, (snapshot) => {
        let count = 0;
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.unreadCountInstructor && data.unreadCountInstructor > 0) {
            count += data.unreadCountInstructor;
          }
        });
        setUnreadDashboard(count);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  // --- [보존] 네비게이션 항목 정의 ---
  const publicLinks = [
    { name: "회사 소개", href: "/company" },
    { name: "베이직 서비스", href: "/basic-service" },
    { name: "프리미엄 서비스", href: "/premium-service" },
    { name: "쇼케이스", href: "/showcase" },
    { name: "문의하기", href: "/contact" },
    { name: "이용요금", href: "/pricing" },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-300 border-b ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-sm" 
            : "bg-white border-transparent"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* 1. 로고 */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
             <div className="relative w-8 h-8">
               <Image src="/images/logo.png" alt="RuleMakers Logo" fill className="object-contain" />
             </div>
             <span className="text-xl font-extrabold text-slate-900 tracking-tighter hidden sm:block">
               RuleMakers
             </span>
          </Link>

          {/* 2. 데스크탑 메인 메뉴 (공개 링크) */}
          <nav className="hidden xl:flex items-center gap-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                  isActive(link.href)
                    ? "text-blue-600 bg-blue-50"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* 3. 우측 액션 버튼 (로그인/유저메뉴) */}
          <div className="flex items-center gap-2 md:gap-4">
            
            {loading ? (
              <div className="w-20 h-8 bg-slate-100 animate-pulse rounded"></div>
            ) : user ? (
              <>
                {/* (1) 시스템 알림 벨 (신규 기능) */}
                <NotificationBell />

                {/* (2) 유저 프로필 드롭다운 */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50 transition-all"
                  >
                    <UserCircleIcon className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-bold text-slate-700 hidden md:block max-w-[100px] truncate">
                      {user.email?.split('@')[0]} T
                    </span>
                    <ChevronDownIcon className={`w-3 h-3 text-slate-400 transition-transform ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isProfileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-100 shadow-xl py-2 animate-in fade-in zoom-in duration-200 origin-top-right">
                      <div className="px-4 py-3 border-b border-slate-50 mb-1 bg-slate-50/50">
                        <p className="text-xs text-slate-400 font-bold">Signed in as</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                      </div>

                      {/* [보존] 강사용 메뉴 */}
                      <Link 
                        href="/dashboard" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium"
                      >
                        대시보드
                        {unreadDashboard > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            {unreadDashboard}
                          </span>
                        )}
                      </Link>
                      <Link 
                        href="/request" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium"
                      >
                        작업 요청하기
                      </Link>
                      <Link 
                        href="/profile/settings" 
                        onClick={() => setIsProfileDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium"
                      >
                        프로필 설정
                      </Link>

                      {/* [보존] 관리자용 메뉴 */}
                      {user.isAdmin && (
                        <>
                          <div className="my-2 border-t border-slate-100"></div>
                          <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase">Admin</div>
                          
                          <Link 
                            href="/admin" 
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold"
                          >
                            접수된 작업
                            {unreadActive > 0 && (
                              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {unreadActive}
                              </span>
                            )}
                          </Link>
                          <Link 
                            href="/admin/completed" 
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-green-600 hover:bg-green-50 font-bold"
                          >
                            완료된 작업
                            {unreadCompleted > 0 && (
                              <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                {unreadCompleted}
                              </span>
                            )}
                          </Link>
                        </>
                      )}

                      <div className="my-2 border-t border-slate-100"></div>
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 hover:text-red-600 text-left"
                      >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" /> 로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link 
                href="/login" 
                className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                로그인
              </Link>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* --- [보존] 모바일 메뉴 Overlay (모든 링크 포함) --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white shadow-2xl p-6 flex flex-col animate-in slide-in-from-right duration-300 overflow-y-auto">
            
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-extrabold text-slate-900">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <XMarkIcon className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {/* 공개 링크 모바일 렌더링 */}
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-bold transition-colors ${
                    isActive(link.href) ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              <div className="my-4 border-t border-slate-100"></div>

              {/* 유저 전용 링크 모바일 렌더링 */}
              {user && (
                <>
                  <Link 
                    href="/dashboard" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex justify-between items-center px-4 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-50"
                  >
                    대시보드
                    {unreadDashboard > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadDashboard}</span>}
                  </Link>
                  <Link href="/request" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-50">
                    작업 요청하기
                  </Link>
                  <Link href="/profile/settings" onClick={() => setIsMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-50">
                    프로필 설정
                  </Link>

                  {user.isAdmin && (
                    <div className="mt-2 bg-slate-50 rounded-xl p-2">
                       <p className="px-2 py-1 text-xs font-bold text-slate-400 uppercase">Admin Zone</p>
                       <Link 
                         href="/admin" 
                         onClick={() => setIsMobileMenuOpen(false)} 
                         className="flex justify-between px-2 py-2 text-sm text-red-600 font-bold hover:bg-slate-100 rounded-lg"
                       >
                         접수된 작업
                         {unreadActive > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadActive}</span>}
                       </Link>
                       <Link 
                         href="/admin/completed" 
                         onClick={() => setIsMobileMenuOpen(false)} 
                         className="flex justify-between px-2 py-2 text-sm text-green-600 font-bold hover:bg-slate-100 rounded-lg"
                       >
                         완료된 작업
                         {unreadCompleted > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCompleted}</span>}
                       </Link>
                    </div>
                  )}
                </>
              )}
            </nav>

            <div className="pt-6 mt-4 border-t border-slate-100">
              {user ? (
                <button 
                  onClick={handleLogout} 
                  className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 flex items-center justify-center gap-2"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" /> 로그아웃
                </button>
              ) : (
                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="block w-full py-3 bg-slate-900 text-white text-center font-bold rounded-xl shadow-lg">
                  로그인 / 회원가입
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}