// components/Header.tsx

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bars3Icon, 
  XMarkIcon, 
  ChevronDownIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Squares2X2Icon,
  PencilSquareIcon,
  Cog6ToothIcon
} from "@heroicons/react/24/outline";

import NotificationBell from "./NotificationBell";

// 네비게이션 메뉴 구조 정의
const NAV_ITEMS = [
  { name: "About Us", href: "/company" },
  { name: "문제은행", href: "/service/maker" },
  { name: "전국 모의고사", href: "/mock-exam" },
  {
    name: "Service Plans",
    href: "#", // 드롭다운 트리거용
    children: [
      { name: "Basic Plan", href: "/basic-service" },
      { name: "Maker's Plan", href: "/premium-service" },
      { name: "Pricing", href: "/pricing" },
    ]
  },
  {
    name: "Contents",
    href: "/showcase",
    children: [
      { name: "전체 보기", href: "/showcase" },
      { name: "학교별 실전 모의고사", href: "/showcase/mock-exam" },
      { name: "학교별 내신 대비 N제", href: "/showcase/n-set" },
      { name: "고난이도 문항모음zip", href: "/showcase/high-difficulty" },
    ]
  },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  // UI 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  // 드롭다운 상태 (데스크탑)
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // 알림 배지 상태
  const [unreadDashboard, setUnreadDashboard] = useState(0);
  const [unreadActive, setUnreadActive] = useState(0);
  const [unreadCompleted, setUnreadCompleted] = useState(0);

  // 스크롤 감지
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 외부 클릭 닫기 (프로필 드롭다운)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Firestore 리스너
  useEffect(() => {
    if (!user) return;
    if (user.isAdmin) {
      const qActive = query(collection(db, "requests"), where("status", "in", ["requested", "in_progress"]));
      const unsubActive = onSnapshot(qActive, (snapshot) => {
        setUnreadActive(snapshot.docs.reduce((acc, doc) => acc + (doc.data().unreadCountAdmin || 0), 0));
      });
      const qCompleted = query(collection(db, "requests"), where("status", "in", ["completed", "rejected"]));
      const unsubCompleted = onSnapshot(qCompleted, (snapshot) => {
        setUnreadCompleted(snapshot.docs.reduce((acc, doc) => acc + (doc.data().unreadCountAdmin || 0), 0));
      });
      return () => { unsubActive(); unsubCompleted(); };
    } else {
      const qInstructor = query(collection(db, "requests"), where("instructorId", "==", user.uid));
      return onSnapshot(qInstructor, (snapshot) => {
        setUnreadDashboard(snapshot.docs.reduce((acc, doc) => acc + (doc.data().unreadCountInstructor || 0), 0));
      });
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

  return (
    <>
      {/* sticky로 변경하여 컨텐츠 가림 현상 해결 */}
      <header 
        className={`sticky top-0 z-50 w-full transition-all duration-300 border-b ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md border-slate-200 shadow-sm h-16" 
            : "bg-white border-transparent h-20"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6 h-full flex items-center justify-between">
          
          {/* 1. 로고 */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
             <div className="relative w-8 h-8 transition-transform group-hover:scale-110 duration-300">
               <Image src="/images/logo.png" alt="RuleMakers Logo" fill className="object-contain" />
             </div>
             <span className="text-xl font-extrabold tracking-tight text-slate-900">
               RuleMakers
             </span>
          </Link>

          {/* 2. 데스크탑 메인 메뉴 */}
          <nav className="hidden xl:flex items-center gap-1 h-full">
            {NAV_ITEMS.map((item) => (
              <div 
                key={item.name}
                className="relative h-full flex items-center"
                onMouseEnter={() => setHoveredMenu(item.name)}
                onMouseLeave={() => setHoveredMenu(null)}
              >
                <Link
                  href={item.href}
                  className={`px-4 py-2 text-sm font-bold transition-colors rounded-full flex items-center gap-1 ${
                    pathname === item.href || (item.children && item.children.some(sub => pathname === sub.href))
                      ? "text-blue-600 bg-blue-50" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {item.name}
                  {item.children && <ChevronDownIcon className="w-3 h-3 mt-0.5" />}
                </Link>

                {/* 드롭다운 메뉴 */}
                {item.children && (
                  <AnimatePresence>
                    {hoveredMenu === item.name && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-slate-100 shadow-xl p-2 z-50"
                      >
                        {item.children.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                              pathname === subItem.href
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                )}
              </div>
            ))}
          </nav>

          {/* 3. 우측 액션 (알림, 프로필) */}
          <div className="flex items-center gap-3">
            
            {loading ? (
              <div className="w-24 h-9 bg-slate-100 animate-pulse rounded-lg"></div>
            ) : user ? (
              <div className="flex items-center gap-3">
                {/* 실제 기능하는 알림 벨 */}
                <NotificationBell />

                {/* 프로필 드롭다운 */}
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border transition-all duration-200 ${
                      isProfileDropdownOpen 
                        ? 'border-blue-300 bg-blue-50 ring-2 ring-blue-100' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 overflow-hidden">
                      {/* 로고 대신 유저 아이콘 사용 (깔끔함 유지) */}
                      <UserCircleIcon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 hidden md:block max-w-[80px] truncate">
                      {user.email?.split('@')[0]}
                    </span>
                    <ChevronDownIcon className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* 프로필 메뉴 */}
                  <AnimatePresence>
                    {isProfileDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 py-2 overflow-hidden origin-top-right z-50"
                      >
                        <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">My Account</p>
                          <p className="text-sm font-bold text-slate-900 truncate">{user.email}</p>
                        </div>

                        <div className="p-2 space-y-1">
                          <DropdownLink href="/dashboard" icon={Squares2X2Icon} label="대시보드" badge={unreadDashboard} onClick={() => setIsProfileDropdownOpen(false)} />
                          <DropdownLink href="/request" icon={PencilSquareIcon} label="작업 요청하기" onClick={() => setIsProfileDropdownOpen(false)} />
                          <DropdownLink href="/profile/settings" icon={Cog6ToothIcon} label="프로필 설정" onClick={() => setIsProfileDropdownOpen(false)} />
                        </div>

                        {user.isAdmin && (
                          <>
                            <div className="h-px bg-slate-100 my-1 mx-2" />
                            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase">Admin Zone</div>
                            <div className="p-2 pt-0 space-y-1">
                               <DropdownLink href="/admin" icon={null} label="접수된 작업" badge={unreadActive} badgeColor="bg-red-500" onClick={() => setIsProfileDropdownOpen(false)} />
                               <DropdownLink href="/admin/completed" icon={null} label="완료된 작업" badge={unreadCompleted} badgeColor="bg-green-500" onClick={() => setIsProfileDropdownOpen(false)} />
                            </div>
                          </>
                        )}

                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <div className="p-2">
                          <button 
                            onClick={handleLogout} 
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                          >
                            <ArrowRightOnRectangleIcon className="w-4 h-4" /> 로그아웃
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                 <Link href="/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 px-3 py-2 transition-colors">로그인</Link>
                 <Link 
                  href="/login" 
                  className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  시작하기
                </Link>
              </div>
            )}

            {/* 모바일 메뉴 버튼 */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="xl:hidden p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* 모바일 메뉴 (Slide Over) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 xl:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-2xl z-50 flex flex-col xl:hidden"
            >
              <div className="p-5 flex items-center justify-between border-b border-slate-100">
                <span className="text-lg font-extrabold text-slate-900">Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                  <XMarkIcon className="w-6 h-6 text-slate-500" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <div key={item.name}>
                    {item.children ? (
                      <div className="py-2">
                         <div className="px-4 py-2 text-base font-bold text-slate-800">{item.name}</div>
                         <div className="pl-4 border-l-2 border-slate-100 ml-4 space-y-1">
                           {item.children.map((sub) => (
                             <Link 
                               key={sub.name} 
                               href={sub.href}
                               onClick={() => setIsMobileMenuOpen(false)}
                               className="block px-4 py-2 text-sm text-slate-600 hover:text-blue-600"
                             >
                               {sub.name}
                             </Link>
                           ))}
                         </div>
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`block px-4 py-3 rounded-xl text-base font-bold transition-all ${
                          pathname === item.href ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                   {!user ? (
                      <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex w-full items-center justify-center px-4 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-md active:scale-95 transition-transform">
                        로그인 / 회원가입
                      </Link>
                   ) : (
                      <button onClick={handleLogout} className="flex w-full items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">
                        <ArrowRightOnRectangleIcon className="w-5 h-5" /> 로그아웃
                      </button>
                   )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// 드롭다운 링크 컴포넌트
function DropdownLink({ href, icon: Icon, label, badge, badgeColor = "bg-red-500", onClick }: any) {
  return (
    <Link 
      href={href} 
      onClick={onClick}
      className="flex items-center justify-between px-3 py-2 text-sm text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors group"
    >
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />}
        <span>{label}</span>
      </div>
      {badge > 0 && (
        <span className={`${badgeColor} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[20px] text-center`}>
          {badge}
        </span>
      )}
    </Link>
  );
}