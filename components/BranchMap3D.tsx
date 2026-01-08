"use client";

import React, { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { MapPinIcon, ArrowPathIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/solid";

// ----------------------------------------------------------------------
// [데이터] 학원 지점 목록
// ----------------------------------------------------------------------
interface Branch {
  id: number;
  name: string;
  subText: string;
  address: string;
  type: "Academy" | "Study Center";
}

const BRANCHES: Branch[] = [
  { id: 1, name: "샤인학원 고등 본관", subText: "동작구 여의대방로 200", address: "서울 동작구 여의대방로 200", type: "Academy" },
  { id: 2, name: "샤인수학과학학원", subText: "영등포구 여의대방로 79", address: "서울 영등포구 여의대방로 79", type: "Academy" },
  { id: 3, name: "샤인학원 초중등관", subText: "동작구 대방동길 86", address: "서울 동작구 대방동길 86", type: "Academy" },
  { id: 4, name: "EG학원 금천관", subText: "금천구 남부순환로 1372", address: "서울 금천구 남부순환로 1372", type: "Academy" },
  { id: 5, name: "EG학원 난곡관", subText: "관악구 남부순환로 1495", address: "서울 관악구 남부순환로 1495", type: "Academy" },
  { id: 6, name: "샤인독서실 동작 본관", subText: "동작구 여의대방로 200", address: "서울 동작구 여의대방로 200", type: "Study Center" },
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
  const [apiKeyStatus, setApiKeyStatus] = useState<string>("");
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);

  // API 키 가져오기
  const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;

  // 1. [진단] 컴포넌트 마운트 시 API 키 확인
  useEffect(() => {
    if (!apiKey) {
      setApiKeyStatus("❌ API 키 없음 (undefined)");
      setDebugStatus("에러: .env.local 파일이 없거나 변수명이 틀렸습니다.");
    } else {
      // 보안을 위해 앞 5자리만 표시
      setApiKeyStatus(`✅ API 키 확인됨 (${apiKey.substring(0, 5)}...)`);
      setDebugStatus("스크립트 로딩 대기 중...");
    }
  }, [apiKey]);

  // 2. 지도 그리기 함수
  const loadKakaoMap = () => {
    if (!window.kakao || !window.kakao.maps) {
      setDebugStatus("⚠️ window.kakao 객체를 찾을 수 없음 (재시도 중)");
      return;
    }

    setDebugStatus("🔄 지도 생성 시도 중...");

    window.kakao.maps.load(() => {
      if (!mapContainer.current) {
        setDebugStatus("❌ 지도 컨테이너(div)를 찾을 수 없음");
        return;
      }

      try {
        const center = new window.kakao.maps.LatLng(37.5061, 126.9230);
        const options = { center: center, level: 7 };
        const map = new window.kakao.maps.Map(mapContainer.current, options);
        setMapInstance(map);

        // 줌 컨트롤
        const zoomControl = new window.kakao.maps.ZoomControl();
        map.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);

        // 마커 생성
        const geocoder = new window.kakao.maps.services.Geocoder();
        
        BRANCHES.forEach((branch) => {
          geocoder.addressSearch(branch.address, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
              
              const imageSrc = branch.type === 'Academy' 
                ? "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png" 
                : "https://t1.daumcdn.net/mapjsapi/images/2x/marker.png";
              
              const marker = new window.kakao.maps.Marker({
                map: map,
                position: coords,
                image: new window.kakao.maps.MarkerImage(imageSrc, new window.kakao.maps.Size(24, 35)),
                title: branch.name
              });

              // 커스텀 오버레이 (심플 버전)
              const content = `
                <div style="padding:5px 10px; background:white; border:1px solid #ccc; border-radius:5px; font-size:12px; font-weight:bold;">
                  ${branch.name}
                </div>`;
                
              const overlay = new window.kakao.maps.CustomOverlay({
                content: content,
                map: map,
                position: coords,
                yAnchor: 2.0
              });
              overlay.setMap(null);

              window.kakao.maps.event.addListener(marker, 'mouseover', () => overlay.setMap(map));
              window.kakao.maps.event.addListener(marker, 'mouseout', () => overlay.setMap(null));
            }
          });
        });

        setIsMapLoaded(true);
        setDebugStatus("✅ 지도 로드 완료!");
      } catch (err: any) {
        console.error(err);
        setDebugStatus(`❌ 지도 생성 중 에러 발생: ${err.message}`);
      }
    });
  };

  // 3. [안전 장치] Script onLoad가 안 먹힐 경우를 대비해 0.5초마다 체크
  useEffect(() => {
    if (isMapLoaded) return;

    const intervalId = setInterval(() => {
      if (window.kakao && window.kakao.maps) {
        loadKakaoMap();
        clearInterval(intervalId); // 성공하면 반복 중단
      }
    }, 500);

    // 10초 뒤에도 안 되면 포기
    const timeoutId = setTimeout(() => {
      clearInterval(intervalId);
      if (!isMapLoaded) {
        setDebugStatus("❌ 타임아웃: 스크립트가 로드되지 않았습니다. (도메인 등록 확인 필요)");
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [isMapLoaded]);

  const handleMoveTo = (branch: Branch) => {
    if (!mapInstance || !window.kakao) return;
    setActiveBranchId(branch.id);
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(branch.address, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const coords = new window.kakao.maps.LatLng(result[0].y, result[0].x);
        mapInstance.panTo(coords);
        setTimeout(() => mapInstance.setLevel(3), 300);
      }
    });
  };

  return (
    <section className="w-full h-[600px] bg-slate-900 relative flex flex-col items-center justify-center border-y border-slate-800">
      
      {/* API Key가 있을 때만 스크립트 로드 시도 */}
      {apiKey && (
        <Script
          src={`//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&libraries=services&autoload=false`}
          strategy="afterInteractive"
          onLoad={() => {
            console.log("Script onLoad fired");
            loadKakaoMap();
          }}
          onError={(e) => {
             console.error("Script load error", e);
             setDebugStatus("❌ 스크립트 네트워크 로드 실패 (차단됨?)");
          }}
        />
      )}

      <div className="relative w-full h-full">
        {/* 지도 컨테이너 */}
        <div ref={mapContainer} className="w-full h-full" />

        {/* [진단용] 로딩 및 상태 표시 화면 (디버깅용 UI) */}
        {!isMapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-50">
             <div className="flex flex-col items-center gap-4 p-8 bg-slate-800 rounded-2xl border border-slate-700 max-w-md w-full shadow-2xl">
               {/* 로딩 아이콘 */}
               <ArrowPathIcon className="w-10 h-10 animate-spin text-blue-500" />
               
               <div className="space-y-3 w-full">
                 {/* 1. API 키 상태 */}
                 <div className="bg-slate-900 p-3 rounded border border-slate-700 flex items-center gap-2">
                   <span className="text-xs text-slate-400">KEY:</span>
                   <span className={`text-xs font-mono ${apiKey ? 'text-green-400' : 'text-red-400'}`}>
                     {apiKeyStatus || "확인 중..."}
                   </span>
                 </div>

                 {/* 2. 현재 진행 상태 */}
                 <div className="bg-slate-900 p-3 rounded border border-slate-700 flex items-center gap-2">
                   <span className="text-xs text-slate-400">STATUS:</span>
                   <span className="text-xs text-yellow-400 font-bold">
                     {debugStatus}
                   </span>
                 </div>
               </div>

               <p className="text-[10px] text-slate-500 mt-2 text-center">
                 문제가 지속되면 개발자 도구(F12) Console을 캡처해주세요.
               </p>
             </div>
          </div>
        )}

        {/* (성공 시) 우측 지점 리스트 */}
        {isMapLoaded && (
           <div className="absolute top-4 right-4 z-20 w-64 bg-white/95 backdrop-blur rounded-xl shadow-lg overflow-hidden hidden md:block max-h-[550px]">
             {/* 기존 리스트 UI 유지 */}
             <div className="p-3 bg-slate-800 text-white flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">학원 목록</h3>
                <CheckCircleIcon className="w-4 h-4 text-green-400" />
             </div>
             <div className="overflow-y-auto max-h-[400px]">
               {BRANCHES.map((branch) => (
                 <button
                   key={branch.id}
                   onClick={() => handleMoveTo(branch)}
                   className={`w-full text-left p-3 border-b hover:bg-slate-50 ${activeBranchId === branch.id ? 'bg-blue-50' : ''}`}
                 >
                   <div className="font-bold text-xs text-slate-800">{branch.name}</div>
                   <div className="text-[10px] text-slate-500">{branch.subText}</div>
                 </button>
               ))}
             </div>
           </div>
        )}
      </div>
    </section>
  );
}