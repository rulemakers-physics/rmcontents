"use client";

import React, { useEffect, useRef, useState } from "react";
import { 
  MapPinIcon, 
  ArrowPathIcon, 
  CheckCircleIcon, 
  ArrowTopRightOnSquareIcon,
  BuildingLibraryIcon,
  XMarkIcon 
} from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------
// [데이터] 학원 지점 목록 (블로그 URL 및 설명 포함)
// ----------------------------------------------------------------------
interface Branch {
  id: number;
  name: string;
  subText: string;
  address: string;
  type: "Office" | "Academy" | "Study Center";
  blogUrl: string;
  description: string;
}

const BRANCHES: Branch[] = [
  { 
    id: 1, 
    name: "RuleMakers 본사", 
    subText: "관악구 솔밭로 19-1", 
    address: "서울 관악구 솔밭로 19-1", 
    type: "Office",
    blogUrl: "https://blog.naver.com/rulemakerslab", 
    description: "교육 최적화를 연구하는 사람들이 모인 곳, RuleMakers입니다."
  },
  { 
    id: 2, 
    name: "샤인학원 고등 본관", 
    subText: "동작구 여의대방로 200", 
    address: "서울 동작구 여의대방로 200", 
    type: "Academy",
    blogUrl: "https://blog.naver.com/shine_academy01",
    description: "대방동 입시의 중심, 샤인학원 고등 본관입니다. 전문 강사진과 체계적인 커리큘럼으로 대학교 진학을 책임집니다."
  },
  { 
    id: 3, 
    name: "샤인수학과학학원", 
    subText: "영등포구 여의대방로 79", 
    address: "서울 영등포구 여의대방로 79", 
    type: "Academy",
    blogUrl: "https://blog.naver.com/shine_masci",
    description: "영등포구 No.1 수학과학 전문 학원입니다."
  },
  { 
    id: 4, 
    name: "샤인학원 초중등관", 
    subText: "동작구 대방동길 86", 
    address: "서울 동작구 대방동길 86", 
    type: "Academy",
    blogUrl: "https://blog.naver.com/PostList.naver?blogId=shine_academy01m",
    description: "탄탄한 기초부터 특목고 대비까지. 동작구 초중등 학생을 위한 곳입니다."
  },
  { 
    id: 5, 
    name: "EG학원 금천관", 
    subText: "금천구 남부순환로 1372", 
    address: "서울 금천구 남부순환로 1372", 
    type: "Academy",
    blogUrl: "https://blog.naver.com/PostList.naver?blogId=eg_gc&from=postList&categoryNo=1",
    description: "금천구 최상위권 도약을 위한 선택. 철저한 내신 관리와 수능 대비 시스템을 갖췄습니다."
  },
  { 
    id: 6, 
    name: "EG학원 난곡관", 
    subText: "관악구 남부순환로 1495", 
    address: "서울 관악구 남부순환로 1495", 
    type: "Academy",
    blogUrl: "https://blog.naver.com/egedud",
    description: "관악구 학생들을 위한 밀착 관리형 내신 전문 학원입니다. 학생 한 명 한 명에게 집중합니다."
  },
  { 
    id: 7, 
    name: "샤인독서실 동작 본관", 
    subText: "동작구 여의대방로 200", 
    address: "서울 동작구 여의대방로 200", 
    type: "Study Center",
    blogUrl: "https://blog.naver.com/shine_studycenter",
    description: "최고의 몰입 환경을 제공하는 프리미엄 관리형 독서실입니다. 입시 소장님과 SKY 출신 멘토들께서 최적의 학습 관리를 제공합니다."
  },
];

declare global {
  interface Window {
    kakao: any;
  }
}

export default function BranchMap3D() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [debugStatus, setDebugStatus] = useState("초기화 중...");
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [activeBranchId, setActiveBranchId] = useState<number>(1);
  const [isInfoOpen, setIsInfoOpen] = useState(true); // 정보 패널 열림 상태

  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
  const activeBranch = BRANCHES.find(b => b.id === activeBranchId) || BRANCHES[0];

  const loadKakaoMap = () => {
    if (!window.kakao || !window.kakao.maps) return;

    window.kakao.maps.load(() => {
      if (!mapContainer.current) return;

      try {
        const center = new window.kakao.maps.LatLng(37.4765, 126.9818);
        const options = { center: center, level: 8 };
        const map = new window.kakao.maps.Map(mapContainer.current, options);
        map.setZoomable(false);
        setMapInstance(map);

        const zoomControl = new window.kakao.maps.ZoomControl();
        // 줌 컨트롤 위치를 '우측 하단'으로 조정하여 패널과 겹침 방지 (선택 사항)
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.BOTTOMRIGHT);

        const geocoder = new window.kakao.maps.services.Geocoder();
        
        BRANCHES.forEach((branch) => {
          geocoder.addressSearch(branch.address, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              
              // Office 타입이면 별표(또는 다른 원하시는 이미지), 아니면 기본 마커
              const imageSrc = branch.type === "Office"
                ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png" 
                : "https://t1.daumcdn.net/mapjsapi/images/2x/marker.png";
              
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: coords,
                image: new window.kakao.maps.MarkerImage(imageSrc, new window.kakao.maps.Size(24, 35)),
                title: branch.name,
                clickable: true
              });

              // 마커 클릭 시
              window.kakao.maps.event.addListener(marker, 'click', () => {
                handleMoveTo(branch);
                setIsInfoOpen(true); // 마커 클릭 시 정보 패널 열기
              });
            }
          });
        });

        setIsMapLoaded(true);
      } catch (err: any) {
        console.error(err);
        setDebugStatus(`에러: ${err.message}`);
      }
    });
  };

  useEffect(() => {
    if (!apiKey) return;
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => loadKakaoMap());
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => window.kakao.maps.load(() => loadKakaoMap());
    document.head.appendChild(script);
  }, [apiKey]);

  const handleMoveTo = (branch: Branch) => {
    if (!mapInstance || !window.kakao) return;
    setActiveBranchId(branch.id);
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(branch.address, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        mapInstance.panTo(coords);
        setTimeout(() => mapInstance.setLevel(3, { animate: true }), 300);
      }
    });
  };

  return (
    <section className="w-full py-24 bg-slate-950 border-y border-slate-800 relative">
      <div className="container mx-auto px-6 h-[600px] max-w-6xl">
        
        {/* [레이아웃] 단일 컨테이너로 복귀 (지도 100%) */}
        <div className="relative w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-slate-700/50 ring-1 ring-white/5 bg-slate-900">
          
          {/* 지도 영역 (전체) */}
          <div ref={mapContainer} className="w-full h-full bg-slate-800" />

          {/* 로딩 중 */}
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
               <div className="flex flex-col items-center gap-2">
                 <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-500" />
                 <span className="text-xs text-slate-500">{debugStatus}</span>
               </div>
            </div>
          )}

          {/* [UI 1] 좌측 학원 목록 (Overlay) */}
          {isMapLoaded && (
             <div className="absolute top-4 left-4 z-20 w-56 bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden hidden md:block border border-slate-200/50">
               <div className="p-3 bg-slate-900 text-white flex justify-between items-center">
                  <h3 className="font-bold text-sm flex items-center gap-2">목록</h3>
                  <CheckCircleIcon className="w-4 h-4 text-green-400" />
               </div>
               <div className="overflow-y-auto max-h-[400px] custom-scrollbar">
                 {BRANCHES.map((branch) => (
                   <button
                     key={branch.id}
                     onClick={() => { handleMoveTo(branch); setIsInfoOpen(true); }}
                     className={`w-full text-left p-3 border-b border-slate-100 hover:bg-blue-50 transition-colors group ${activeBranchId === branch.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
                   >
                     <div className={`font-bold text-xs group-hover:text-blue-700 ${activeBranchId === branch.id ? 'text-blue-700' : 'text-slate-800'}`}>
                       {branch.name}
                     </div>
                     <div className="text-[10px] text-slate-500 mt-0.5 truncate">{branch.subText}</div>
                   </button>
                 ))}
               </div>
             </div>
          )}

          {/* [UI 2] 우측 정보 패널 (Overlay) */}
          {isMapLoaded && isInfoOpen && (
            <div className="absolute top-4 right-4 z-20 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/50 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* 상단 닫기 버튼 */}
              <button 
                onClick={() => setIsInfoOpen(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>

              <div className="p-6">
                {/* 뱃지 */}
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    activeBranch.type === 'Office' 
                      ? 'bg-slate-200 text-slate-700' // Office 색상 (회색 계열 추천)
                      : activeBranch.type === 'Academy' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {activeBranch.type}
                  </span>
                  {activeBranch.id === 1 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 uppercase tracking-wider">
                      HQ
                    </span>
                  )}
                </div>

                {/* 제목 및 주소 */}
                <h2 className="text-xl font-extrabold text-slate-900 mb-2 leading-tight">
                  {activeBranch.name}
                </h2>
                <p className="text-xs text-slate-500 flex items-start gap-1 mb-5">
                  <MapPinIcon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  {activeBranch.address}
                </p>

                {/* 설명 박스 */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-6">
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    {activeBranch.description}
                  </p>
                </div>

                {/* 하단 액션 버튼 */}
                <a 
                  href={activeBranch.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#03C75A] hover:bg-[#02b351] py-3 text-white font-bold shadow-md shadow-green-100 transition-all active:scale-95"
                >
                  <span className="text-sm">블로그 방문하기</span>
                  <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}