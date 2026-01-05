// components/ExamAnalysisPanel.tsx

"use client";

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
  // Legend는 커스텀 구현을 위해 제거
} from 'recharts';
import { ExamPaperProblem } from '@/types/exam';
import { ChartPieIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';

interface Props {
  problems: ExamPaperProblem[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#14b8a6'];

export default function ExamAnalysisPanel({ problems }: Props) {
  
  // 1. 난이도 분포 데이터
  const difficultyData = useMemo(() => {
    const counts: Record<string, number> = { '기본': 0, '하': 0, '중': 0, '상': 0, '킬러': 0 };
    problems.forEach(p => {
      if (p.difficulty && counts[p.difficulty] !== undefined) {
        counts[p.difficulty]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [problems]);

  // 2. 소단원별 비중 데이터 (전체 표시, 값 기준 내림차순 정렬)
  const topicData = useMemo(() => {
    const counts: Record<string, number> = {};
    problems.forEach(p => {
      const topic = p.minorTopic || "기타";
      counts[topic] = (counts[topic] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [problems]);

  // 3. 문항 속성 분석
  const typeStats = useMemo(() => {
    let graph = 0;
    let table = 0;
    let text = 0;
    let image = 0;
    let convergence = 0;

    problems.forEach(p => {
      const tags = (p as any).dataTypes; 
      if (tags) {
        if (tags.graph) graph++;
        if (tags.table) table++;
        if (tags.text) text++;
        if (tags.image) image++;
      }
      if ((p as any).isConvergence) convergence++;
    });

    return { graph, table, text, image, convergence };
  }, [problems]);

  if (problems.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white">
        <ChartPieIcon className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-sm">문항을 추가하면<br/>실시간 분석 리포트가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5 custom-scrollbar bg-white space-y-8 pb-20 border-l border-gray-200">
      <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
        <Square3Stack3DIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-slate-900">시험지 분석 리포트</h2>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 mb-1 font-bold">총 문항 수</p>
          <p className="text-2xl font-black text-slate-900">{problems.length}<span className="text-sm font-normal text-slate-400 ml-1">제</span></p>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
          <p className="text-xs text-slate-500 mb-1 font-bold">융합형 문항</p>
          <p className="text-2xl font-black text-purple-600">
            {typeStats.convergence}<span className="text-sm font-normal text-purple-400 ml-1">제</span>
          </p>
        </div>
      </div>

      {/* 1. 난이도 분포 차트 */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-orange-500 rounded-full"></span> 난이도 구성
        </h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={difficultyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 11}} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
              />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. 소단원별 비중 (Pie Chart + Custom Legend) */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span> 소단원별 출제 비중
        </h3>
        
        {/* [수정] 차트 영역: 높이 고정 (글자에 밀리지 않음) */}
        <div className="h-[220px] w-full relative mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
              <Pie
                data={topicData}
                cx="50%" cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {topicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={2} stroke="#fff" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          {/* 중앙에 총 문항 수 표시 (도넛 차트 효과) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <span className="block text-2xl font-black text-slate-800">{problems.length}</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Total</span>
          </div>
        </div>

        {/* [수정] 커스텀 범례 영역: HTML 리스트로 구현 (데이터 많으면 아래로 늘어남) */}
        <div className="space-y-2 border-t border-slate-50 pt-3">
          {topicData.map((entry, index) => {
            const percentage = ((entry.value / problems.length) * 100).toFixed(1);
            return (
              <div key={entry.name} className="flex items-center justify-between text-xs group hover:bg-slate-50 p-1.5 rounded-lg transition-colors">
                 <div className="flex items-center gap-2 overflow-hidden">
                    <div 
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                    />
                    <span className="text-slate-600 font-medium truncate max-w-[140px]" title={entry.name}>
                      {entry.name}
                    </span>
                 </div>
                 <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-400 font-medium">{percentage}%</span>
                    <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px] min-w-[24px] text-center">
                      {entry.value}
                    </span>
                 </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. 자료 유형 분석 */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
         <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">자료 유형 분석</h3>
         <div className="flex flex-wrap gap-2">
            <TagBadge label="그래프" count={typeStats.graph} />
            <TagBadge label="표" count={typeStats.table} />
            <TagBadge label="그림/도식" count={typeStats.image} />
            <TagBadge label="지문" count={typeStats.text} />
         </div>
      </div>

    </div>
  );
}

function TagBadge({ label, count }: { label: string, count: number }) {
  if (count === 0) return null;
  return (
    <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 shadow-sm flex items-center gap-1">
       {label} <span className="text-blue-600 font-bold">{count}</span>
    </span>
  );
}