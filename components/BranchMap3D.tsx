"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
// 아이콘이 없다면 `npm install lucide-react` 설치 필요
// 설치가 어렵다면 아래 import를 지우고 텍스트나 기본 div로 대체해도 됩니다.
import { MapPin, Building2, BookOpen } from "lucide-react"; 

// ----------------------------------------------------------------------
// [설정 및 데이터]
// ----------------------------------------------------------------------

// 지도 회전 각도 (지도가 누워있는 각도)
const MAP_ROTATION = { x: 60, z: -20 };

interface Branch {
  id: number;
  name: string;
  subText: string;
  type: "Academy" | "Study Center";
  top: number;  // % 좌표
  left: number; // % 좌표
}

const BRANCHES: Branch[] = [
  { id: 6, name: "샤인독서실", subText: "동작 본관", type: "Study Center", top: 20, left: 65 },
  { id: 1, name: "샤인학원", subText: "고등 본관", type: "Academy", top: 45, left: 45 },
  { id: 2, name: "샤인학원", subText: "수학과학관", type: "Academy", top: 48, left: 50 },
  { id: 3, name: "샤인학원", subText: "초중등관", type: "Academy", top: 42, left: 40 },
  { id: 4, name: "EG학원", subText: "금천관", type: "Academy", top: 75, left: 25 },
  { id: 5, name: "EG학원", subText: "난곡관", type: "Academy", top: 60, left: 30 },
];

export default function BranchMap3D() {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  return (
    <section className="w-full h-[800px] bg-[#050505] relative overflow-hidden flex items-center justify-center">
      
      {/* 1. 배경: 노이즈 및 조명 효과 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 노이즈 패턴 (URL 방식 대신 CSS로 간단히 처리 가능하지만, 여기선 외부 SVG 패턴 사용) */}
        <div className="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        <div className="absolute top-[-10%] left-[10%] w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* 2. 3D 맵 컨테이너 */}
      <div className="perspective-[2000px] w-full h-full flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, rotateX: 90 }}
          whileInView={{ opacity: 1, rotateX: MAP_ROTATION.x }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ 
            transformStyle: "preserve-3d", // 3D 자식 요소 보존
            rotateZ: MAP_ROTATION.z,
          }}
          className="relative w-[90vw] max-w-[1000px] aspect-[4/3] md:w-[800px] md:h-[600px]"
        >
          
          {/* --- [MAP BASE LAYERS] --- */}
          
          {/* 그림자 (지도가 붕 떠있는 느낌) */}
          <div 
             className="absolute inset-0 rounded-[3rem] bg-black/50 blur-2xl"
             style={{ transform: 'translateZ(-50px) scale(0.9)' }} 
          />

          {/* 실제 지도 플레이트 */}
          <div className="absolute inset-0 rounded-[2rem] overflow-hidden border border-white/10 bg-[#0F111A] shadow-2xl backface-hidden group">
            
            {/* 지도 배경 패턴 (이미지 없을 때 표시됨) */}
            <div className="absolute inset-0 bg-[#0B0C15] opacity-90">
               {/* 그리드 라인 */}
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
               {/* 중앙 하이라이트 */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_70%)]" />
            </div>

            {/* ⚠️ 지도 이미지: 이미지를 구하면 아래 주석을 해제하고 경로를 수정하세요 */}
            {/* <Image 
              src="/images/map-dark.png" 
              alt="Map Background" 
              fill
              className="object-cover opacity-60 grayscale mix-blend-overlay"
            />
            */}

            {/* 스캔 라인 애니메이션 (global.css에 정의됨) */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/10 to-transparent h-[200%] w-full animate-scan-slow pointer-events-none" />
            
            {/* 지역 라벨 */}
            <div className="absolute top-[10%] left-[10%] text-white/5 font-black text-[8vw] leading-none select-none pointer-events-none">
                SEOUL<br/>SOUTH
            </div>
          </div>

          {/* --- [PINS & MARKERS] --- */}
          {BRANCHES.map((branch) => (
            <MapMarker 
              key={branch.id} 
              branch={branch} 
              isHovered={hoveredId === branch.id}
              setHovered={setHoveredId}
            />
          ))}

        </motion.div>
      </div>

      {/* 하단 안내 문구 */}
      <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none z-50">
        <p className="text-white/40 text-sm tracking-widest uppercase animate-pulse">
          Interactive Map System
        </p>
      </div>
    </section>
  );
}

// ----------------------------------------------------------------------
// [핀 컴포넌트] : 핀과 툴팁이 정면을 보게 만드는 핵심 로직 포함
// ----------------------------------------------------------------------

function MapMarker({ 
  branch, 
  isHovered, 
  setHovered 
}: { 
  branch: Branch; 
  isHovered: boolean; 
  setHovered: (id: number | null) => void; 
}) {
  // [중요] 지도 회전(X: 60, Z: -20)을 역으로 계산하여 핀을 똑바로 세움
  const antiRotationStyle = {
    transform: `rotateZ(${-MAP_ROTATION.z}deg) rotateX(${-MAP_ROTATION.x}deg)`,
  };

  return (
    <div
      className="absolute transform-style-3d"
      style={{ 
        top: `${branch.top}%`, 
        left: `${branch.left}%`,
        zIndex: isHovered ? 100 : 10, 
      }}
    >
      {/* 인터랙션 영역 */}
      <motion.div
        className="relative w-12 h-12 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group"
        style={antiRotationStyle} // 👈 핀을 세우는 핵심 스타일
        onMouseEnter={() => setHovered(branch.id)}
        onMouseLeave={() => setHovered(null)}
        initial={false}
        animate={isHovered ? { scale: 1.1, y: -20 } : { scale: 1, y: 0 }}
      >
        
        {/* 1. 핀 디자인 (비콘 스타일) */}
        <div className="relative flex flex-col items-center justify-center">
           {/* 아이콘 원형 */}
           <div className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-colors duration-300 ${
             branch.type === 'Academy' 
               ? 'bg-blue-500/20 border-blue-400/50 text-blue-200' 
               : 'bg-purple-500/20 border-purple-400/50 text-purple-200'
           }`}>
             {/* 아이콘이 없다면 텍스트로 대체 */}
             {branch.type === 'Academy' ? <BookOpen size={16} /> : <Building2 size={16} />}
           </div>
           
           {/* 핀 기둥 (광선) */}
           <div className={`w-[2px] h-8 bg-gradient-to-b from-current to-transparent opacity-50 ${
              branch.type === 'Academy' ? 'text-blue-400' : 'text-purple-400'
           }`} />

           {/* 바닥 포인트 (접지점 - 펄스 효과) */}
           <div className={`absolute -bottom-8 w-2 h-2 rounded-full animate-ping ${
              branch.type === 'Academy' ? 'bg-blue-500' : 'bg-purple-500'
           }`} />
        </div>

        {/* 2. 툴팁 (정보 카드) */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: -10, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.9 }}
              className="absolute bottom-[140%] left-1/2 -translate-x-1/2 w-[280px]"
            >
              {/* 툴팁 카드 디자인 */}
              <Link href={`/company/branch/${branch.id}`}>
                <div className="relative bg-[#0B0C15]/90 backdrop-blur-xl border border-white/10 p-5 rounded-xl shadow-2xl overflow-hidden group-hover:border-white/20 transition-colors text-left">
                    
                    {/* 상단 컬러 바 */}
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${
                        branch.type === 'Academy' ? 'from-blue-500 to-cyan-400' : 'from-purple-500 to-pink-400'
                    }`} />

                    <div className="flex justify-between items-start mb-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                            branch.type === 'Academy' 
                             ? 'bg-blue-500/10 border-blue-500/20 text-blue-300' 
                             : 'bg-purple-500/10 border-purple-500/20 text-purple-300'
                        }`}>
                            {branch.type}
                        </span>
                    </div>

                    <h3 className="text-white font-bold text-lg leading-tight">{branch.name}</h3>
                    <p className="text-white/50 text-sm mt-0.5 mb-4">{branch.subText}</p>

                    <div className="flex items-center justify-between text-xs text-white/80 font-medium bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-colors">
                       <span>상세 정보 보기</span>
                       <span>→</span>
                    </div>
                </div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
}