// components/Footer.tsx

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

// 상수 (실제 정보로 수정 필요)
const LINKS = {
  blog: "https://blog.naver.com/rulemakerslab",
  instagram: "https://www.instagram.com/rulemakers_lab",
  kakao: "http://pf.kakao.com/_rxgPmn",
};

const COMPANY_INFO = {
  name: "(주)룰메이커스",
  ceo: "이승용",
  address: "서울특별시 관악구 솔밭로 19-1",
  license: "665-86-02814",
  email: "dev@rulemakers.co.kr",
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          {/* 1. Brand Column */}
          <div className="col-span-1 md:col-span-1 space-y-4">
             <div className="relative w-8 h-8">
               <Image src="/images/logo.png" alt="Logo" fill className="object-contain" />
             </div>
             <p className="text-sm text-slate-500 leading-relaxed font-medium">
               교육의 새로운 기준,<br/>RuleMakers
             </p>
          </div>

          {/* 2. Services Column */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Services</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/service/maker" className="hover:text-blue-600 transition-colors">문제은행 (Maker)</Link></li>
              <li><Link href="/basic-service" className="hover:text-blue-600 transition-colors">베이직 플랜</Link></li>
              <li><Link href="/premium-service" className="hover:text-blue-600 transition-colors">메이커스 플랜</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600 transition-colors">이용 요금</Link></li>
            </ul>
          </div>

          {/* 3. Company Column */}
          <div>
            <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/company" className="hover:text-blue-600 transition-colors">회사 소개</Link></li>
              <li><Link href="/showcase" className="hover:text-blue-600 transition-colors">제작 사례</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 transition-colors">도입 문의</Link></li>
            </ul>
          </div>

           {/* 4. Contact & SNS Column */}
           <div>
             <h4 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wider">Stay Connected</h4>
             <div className="flex gap-3 mb-6">
               <SocialButton href={LINKS.blog} label="Blog" />
               <SocialButton href={LINKS.instagram} label="Insta" />
               <SocialButton href={LINKS.kakao} label="Kakao" />
             </div>
             <p className="text-xs text-slate-400">
               평일 10:00 - 18:00 (주말/공휴일 제외)
             </p>
           </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-100 my-8" />

        {/* Bottom Info */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs text-slate-400">
           <div className="space-y-1">
             <p>상호명: {COMPANY_INFO.name} | 대표자: {COMPANY_INFO.ceo} | 사업자등록번호: {COMPANY_INFO.license}</p>
             <p>주소: {COMPANY_INFO.address} | 이메일: {COMPANY_INFO.email}</p>
             <p className="mt-2">© {currentYear} RuleMakers Inc. All rights reserved.</p>
           </div>
           
           <div className="flex gap-4">
             <Link href="/terms" className="hover:text-slate-600 transition-colors">이용약관</Link>
             <Link href="/privacy" className="hover:text-slate-600 transition-colors font-bold">개인정보처리방침</Link>
           </div>
        </div>

      </div>
    </footer>
  );
}

function SocialButton({ href, label }: { href: string, label: string }) {
  // 실제로는 아이콘 SVG나 이미지를 넣으면 더 좋습니다.
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 hover:bg-blue-600 hover:text-white transition-all"
    >
      {label[0]}
    </a>
  );
}