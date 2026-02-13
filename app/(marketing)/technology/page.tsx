// app/(marketing)/technology/page.tsx

import DeepTechShowcase from "@/components/DeepTechShowcase";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Core Technology | RuleMakers",
  description: "룰메이커스의 독자적인 AI 문항 분석 기술과 27개의 초정밀 태깅 시스템, 벡터 검색 엔진을 소개합니다.",
  openGraph: {
    title: "RuleMakers Technology - Data Intelligence",
    description: "데이터가 쌓일수록 강력해지는 에듀테크 기술의 정점. 룰메이커스의 핵심 기술을 확인하세요.",
  },
};

export default function TechnologyPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <DeepTechShowcase />
    </main>
  );
}