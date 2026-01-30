// components/NSetPdfViewer.tsx
"use client";

import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// [스타일] react-pdf 필수 스타일
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// [Polyfill] Next.js 16 / pdfjs-dist v4 호환성
if (typeof Promise.withResolvers === "undefined") {
  if (typeof window !== "undefined") {
    // @ts-expect-error This is a manual polyfill
    window.Promise.withResolvers = function () {
      let resolve, reject;
      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    };
  }
}

// [Worker 설정]
const pdfjsVersion = pdfjs.version || "4.4.168"; 
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export default function NSetPdfViewer() {
  const [numPages, setNumPages] = useState<number>(0);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [isClient, setIsClient] = useState(false);

  // 반응형 너비 조절
  useEffect(() => {
    setIsClient(true);
    
    function updateWidth() {
      const width = window.innerWidth;
      const maxWidth = 850; 
      
      if (width < 1024) {
        setContainerWidth(width - 80); 
      } else {
        setContainerWidth(maxWidth);
      }
    }

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  if (!isClient) {
    return (
      <div className="h-[800px] w-full flex items-center justify-center bg-slate-100 text-slate-400 rounded-xl border border-slate-200">
        N제 뷰어 로딩 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-5xl mx-auto">
      <div 
        className="relative w-full h-[800px] overflow-y-auto bg-slate-200/60 rounded-xl border border-slate-300 shadow-inner p-4 md:p-8 select-none scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* [핵심] N제 PDF 파일 경로 고정 */}
        <Document
          file="/sample_n_set.pdf" 
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="h-full w-full flex items-center justify-center text-slate-500">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <span className="font-medium">N제 불러오는 중...</span>
              </div>
            </div>
          }
          error={
            <div className="h-full w-full flex flex-col items-center justify-center text-red-400 gap-2">
              <p className="font-bold">PDF 파일을 불러올 수 없습니다.</p>
              <p className="text-sm text-slate-500">public 폴더에 sample_n_set.pdf 파일이 있는지 확인해주세요.</p>
            </div>
          }
          className="flex flex-col items-center gap-8 min-h-full"
        >
          {Array.from(new Array(numPages), (el, index) => (
            <div 
              key={`page_${index + 1}`} 
              className="relative shadow-2xl rounded-sm overflow-hidden bg-white"
            >
              <Page
                pageNumber={index + 1}
                width={containerWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="block"
                loading={
                  <div 
                    style={{ width: containerWidth, height: containerWidth * 1.414 }} 
                    className="bg-white flex items-center justify-center text-slate-300 text-sm"
                  >
                    Loading Page {index + 1}...
                  </div>
                }
              />
              
              {/* 워터마크 */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] overflow-hidden z-10">
                <div className="text-slate-900 text-5xl md:text-7xl font-black -rotate-45 whitespace-nowrap">
                  RuleMakers N-Set
                </div>
              </div>

              {/* 페이지 번호 */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-mono">
                - {index + 1} -
              </div>
            </div>
          ))}
        </Document>
      </div>
      
      <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
        <span>💡 마우스 휠을 사용하여 스크롤하세요</span>
      </div>
    </div>
  );
}