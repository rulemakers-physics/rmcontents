// components/WeaknessRadarChart.tsx

"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { AnalysisResult } from '@/utils/analysisHelper';

interface Props {
  data: AnalysisResult[];
}

export default function WeaknessRadarChart({ data }: Props) {
  // 데이터가 없으면 안내 메시지
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p>분석할 데이터가 충분하지 않습니다.</p>
      </div>
    );
  }

  // 상위 6개 항목만 추출 (차트 가독성 위해)
  // 점수가 낮은 순(취약한 순) 혹은 단원 순서대로 정렬 가능
  const chartData = data.map(d => ({
    subject: d.topic,
    score: d.score,
    fullMark: 100
  }));

  return (
    <div className="w-full h-80 relative">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: '#64748b', fontSize: 11, fontWeight: 'bold' }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="AI 숙련도"
            dataKey="score"
            stroke="#6366f1" // Indigo-500
            strokeWidth={3}
            fill="#6366f1"
            fillOpacity={0.3}
          />
          <Tooltip 
            formatter={(value: number) => [`${value}점`, '숙련도']}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* 중앙 점수 표시 (옵션) */}
      <div className="absolute top-2 right-2">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
          Analysis
        </span>
      </div>
    </div>
  );
}