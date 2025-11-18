// components/HitRateTable.tsx

"use client";

import { DocumentMagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

// 1. 샘플 데이터 정의
const hitRateData = [
  {
    school: "OO고등학교",
    exam: "2학년 1학기 중간고사",
    hits: { a: 3, b: 8, c: 5 },
    total: 16,
    bestSample: {
      questionNumber: "12번",
      similarity: "A",
      description: "그래프 개형 및 조건 일치",
    },
  },
  {
    school: "XX여자고등학교",
    exam: "2학년 1학기 중간고사",
    hits: { a: 2, b: 10, c: 4 },
    total: 16,
    bestSample: {
      questionNumber: "서술형 3번",
      similarity: "A",
      description: "핵심 조건 및 풀이 로직 동일",
    },
  },
  {
    school: "△△고등학교",
    exam: "1학년 2학기 기말고사",
    hits: { a: 1, b: 7, c: 7 },
    total: 15,
    bestSample: {
      questionNumber: "9번",
      similarity: "B",
      description: "자료 해석 및 보기 구성 유사",
    },
  },
];

// 2. 유사도 등급 배지 컴포넌트
function SimilarityBadge({ similarity }: { similarity: "A" | "B" | "C" }) {
  const styles = {
    A: "bg-red-100 text-red-800 ring-red-600/20",
    B: "bg-blue-100 text-blue-800 ring-blue-600/20",
    C: "bg-green-100 text-green-800 ring-green-600/20",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${styles[similarity]}`}
    >
      {similarity}등급
    </span>
  );
}

// 3. 메인 테이블 컴포넌트
export default function HitRateTable() {
  const handleSampleClick = (sample: typeof hitRateData[0]["bestSample"]) => {
    // TODO: 실제로는 모달(Dialog)을 띄워 샘플 이미지를 보여줘야 합니다.
    alert(
      `[우수 사례 샘플]\n문항: ${sample.questionNumber}\n유사도: ${sample.similarity}\n내용: ${sample.description}\n\n(실제로는 여기에 비교 이미지가 표시됩니다.)`
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
            >
              학교명
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
            >
              시험
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
            >
              적중 문항 (A/B/C)
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
            >
              총 적중률
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500"
            >
              우수 사례 샘플
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {hitRateData.map((row) => (
            <tr key={row.school} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                {row.school}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                {row.exam}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <div className="flex items-center space-x-2">
                  <SimilarityBadge similarity="A" />
                  <span>{row.hits.a}</span>
                  <SimilarityBadge similarity="B" />
                  <span>{row.hits.b}</span>
                  <SimilarityBadge similarity="C" />
                  <span>{row.hits.c}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-800">
                {row.total} 문항
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSampleClick(row.bestSample)}
                  className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 hover:bg-blue-100"
                >
                  <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                  <span>
                    {row.bestSample.questionNumber} ({row.bestSample.similarity}
                    등급)
                  </span>
                </motion.button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-gray-200 bg-gray-50 px-6 py-3">
        <p className="text-xs text-gray-600">
          * A등급: 그래프, 자료, 조건, 보기(답)까지 매우 유사 / B등급: 핵심
          아이디어 및 자료, 보기 구성 유사 / C등급: 동일 개념 및 유형
        </p>
      </div>
    </div>
  );
}