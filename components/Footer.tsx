// components/Footer.tsx

"use client";

import Link from "next/link";
import Image from "next/image";

// 상수 (실제 정보로 수정 필요)
const LINKS = {
  blog: "https://blog.naver.com/rulemakerslab",
  instagram: "https://www.instagram.com/rulemakers_lab",
  kakao: "http://pf.kakao.com/_rxgPmn",
};

const COMPANY_INFO = {
  name: "(주)룰메이커스",
  ceo: "이승용",
  head: "이정한",
  address: "서울특별시 관악구 솔밭로 19-1",
  license: "665-86-02814",
  // 통신판매업신고번호 및 전화번호 추가
  telecommunication: "2025-서울관악-0481", 
  phone: "010-5900-4869",
  email: "contact@rulemakers.co.kr",
};

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-12 font-sans">
      <div className="container mx-auto px-6 max-w-6xl">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* 1. Brand Column (넓게 배치) */}
          <div className="lg:col-span-2 space-y-6">
             <div className="relative w-32 h-8">
                {/* 로고 이미지가 가로형이라고 가정, 비율에 맞게 조정 */}
               <Image 
                 src="/images/logo.png" 
                 alt="RuleMakers" 
                 fill 
                 className="object-contain object-left" 
               />
             </div>
             <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-xs">
               RuleMakers의 교육 지원 솔루션을 통해<br/>
               최적화된 교육을 만나보세요!
             </p>
             <div className="flex gap-3">
               <SocialButton href={LINKS.blog} label="Blog" src="/images/blog.png" />
               <SocialButton href={LINKS.instagram} label="Insta" src="/images/instagram.png" />
               <SocialButton href={LINKS.kakao} label="Kakao" src="/images/kakao.png" />
             </div>
          </div>

          {/* 2. Company Column */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 text-xs uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/company" className="hover:text-blue-600 transition-colors">회사 소개</Link></li>
              <li><Link href="/technology" className="text-sm leading-6 text-gray-600 hover:text-blue-600 font-medium">Core Technology</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 transition-colors">도입 문의</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600 transition-colors">이용약관</Link></li>
              <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">개인정보처리방침</Link></li>
            </ul>
          </div>

          {/* 3. Service Column */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 text-xs uppercase tracking-wider">Service</h4>
            <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/maker-guide" className="hover:text-blue-600 transition-colors">PASS 문제은행</Link></li>
              <li><Link href="/mock-exam" className="hover:text-blue-600 transition-colors">전국 모의고사</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600 transition-colors">이용 요금 및 결제</Link></li>
            </ul>
          </div>

           {/* 4. Plans & Contents Column */}
           <div>
             <h4 className="font-bold text-slate-900 mb-6 text-xs uppercase tracking-wider">Plans</h4>
             <ul className="space-y-3 text-sm text-slate-500">
              <li><Link href="/basic-service" className="hover:text-blue-600 transition-colors">베이직 플랜</Link></li>
              <li><Link href="/premium-service" className="hover:text-blue-600 transition-colors">메이커스 플랜</Link></li>
              <li><Link href="/showcase" className="hover:text-blue-600 transition-colors">자체 제작 컨텐츠 소개</Link></li>
             </ul>
           </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-300 my-8" />

        {/* Bottom Info */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 text-[12px] text-slate-500 leading-relaxed">
           <div className="space-y-1">
             <p className="font-bold text-slate-600 text-xs mb-2">{COMPANY_INFO.name}</p>
             <p>
               대표자: {COMPANY_INFO.ceo} <span className="mx-2">|</span> 
               사업자등록번호: {COMPANY_INFO.license} <span className="mx-2">|</span> 
               통신판매업신고번호: {COMPANY_INFO.telecommunication}
             </p>
             <p>
               주소: {COMPANY_INFO.address} <span className="mx-2">|</span> 
               개인정보보호책임자: {COMPANY_INFO.head}
             </p>
             <p>
               대표전화: {COMPANY_INFO.phone} <span className="mx-2">|</span> 
               이메일: {COMPANY_INFO.email}
             </p>
             <p className="mt-4">
               Copyright © {currentYear} RuleMakers Inc. All rights reserved.
             </p>
           </div>
           
           <div className="text-right hidden lg:block">
              <p>평일 10:00 - 18:00 (점심시간 12:30 - 14:00)</p>
              <p>수요일, 토요일 및 공휴일 휴무</p>
           </div>
        </div>

      </div>
    </footer>
  );
}

function SocialButton({ href, label, src }: { href: string, label: string, src: string }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="relative w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group grayscale hover:grayscale-0"
    >
      <Image 
        src={src} 
        alt={label} 
        fill 
        className="object-cover p-2 transition-transform duration-300 group-hover:scale-110" 
        sizes="36px"
      />
    </a>
  );
}