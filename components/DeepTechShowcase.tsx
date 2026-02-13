"use client";

import { motion } from "framer-motion";
import { 
  Network, 
  GitMerge, 
  Database, 
  Cpu, 
  Share2, 
  ScanSearch,
  CheckCircle2
} from "lucide-react";

// ✅ 데이터 시각화용 더미 데이터 (실제 JSON 구조 반영)
const TAG_DATA = [
  { label: "소재 수준", value: "심화 교과", color: "text-blue-400" },
  { label: "자료 유형", value: "도식 그림", color: "text-purple-400" },
  { label: "질문 형식", value: "기본 선지형", color: "text-emerald-400" },
  { label: "확정 난이도", value: "2.0 (Mid)", color: "text-orange-400" },
  { label: "벡터 클러스터", value: "Cluster #29", color: "text-pink-400" },
];

export default function DeepTechShowcase() {
  return (
    <div className="bg-slate-950 min-h-screen text-white overflow-hidden font-sans pb-20">
      
      {/* Hero Section: 기술 철학 */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold mb-6">
            Core Technology
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Data Intelligence <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Beyond Simple Database
            </span>
          </h1>
          <p className="text-slate-400 text-xl max-w-3xl mx-auto leading-relaxed">
            룰메이커스의 문항은 단순한 텍스트가 아닙니다. <br />
            <span className="text-white font-semibold">수십개의 초정밀 태그</span>와 <span className="text-white font-semibold">다차원 벡터</span>로 살아 숨 쉬는 지능형 데이터입니다.
          </p>
        </motion.div>
      </section>

      {/* Feature 1: Hyper-Granular Tagging */}
      <section className="py-24 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4 text-purple-400">
              <Database className="w-6 h-6" />
              <span className="font-bold tracking-wider uppercase">Hyper-Granular Tagging</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              모든 문항을 <br />
              <span className="text-purple-400">나노 단위</span>로 분해합니다.
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              단순히 '단원'만 분류하지 않습니다. 자료의 형태(그래프, 표, 그림), 
              질문의 방식, 소재의 융합 여부까지 분석하여 <br/>
              문항 하나에 30개 이상의 메타데이터를 부여합니다.
            </p>

            <ul className="space-y-4">
              {[
                "자료 세부 유형 (막대 그래프, 도식 등)",
                "융합형 소재 판별 알고리즘",
                "질문 세부 형식 (보기 선택형, 단답형)",
                "정량적 난이도 산출 (0.0 ~ 5.0)"
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Right: 태그 시각화 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl"
          >
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
            
            <div className="relative z-10 font-mono text-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                <span className="text-slate-500">Problem_ID: a-3-12-0218</span>
                <span className="px-2 py-1 bg-green-500/10 text-green-400 rounded text-xs">Verified</span>
              </div>
              
              {TAG_DATA.map((tag, i) => (
                <div key={i} className="flex items-center gap-4 group hover:bg-white/5 p-2 rounded transition-colors">
                  <span className="w-24 text-slate-500 text-xs uppercase">{tag.label}</span>
                  <div className="flex-1 h-px bg-slate-800 group-hover:bg-slate-700 transition-colors" />
                  <span className={`font-semibold ${tag.color}`}>{tag.value}</span>
                </div>
              ))}

              <div className="mt-6 pt-4 border-t border-slate-800">
                <div className="text-slate-500 text-xs mb-2">RAW JSON DATA SNIPPET</div>
                <pre className="text-[10px] text-slate-600 overflow-hidden">
                  {`{
  "q_text": "판의 경계...",
  "x": 3.827, "y": 7.090, "z": -1.035,
  "cluster": 29,
  "similar_problems": [ ... ]
}`}
                </pre>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature 2: Vector Similarity */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: 3D 그래프 느낌 시각화 */}
          <div className="order-2 lg:order-1 relative h-[400px] bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center overflow-hidden group">
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-64 h-64 border border-blue-500/20 rounded-full animate-[spin_10s_linear_infinite]" />
                <div className="absolute w-48 h-48 border border-purple-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" />
             </div>
             
             <div className="relative z-10 text-center">
               <Share2 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
               <div className="bg-slate-950/80 backdrop-blur px-4 py-2 rounded-lg border border-blue-500/30">
                 <div className="text-xs text-slate-400">Vector Coordinate</div>
                 <div className="text-blue-400 font-mono font-bold">x: 3.82, y: 7.09, z: -1.03</div>
               </div>
             </div>
          </div>

          <motion.div 
            className="order-1 lg:order-2"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-3 mb-4 text-blue-400">
              <Network className="w-6 h-6" />
              <span className="font-bold tracking-wider uppercase">Vector Space Analysis</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              문항 간의 <span className="text-blue-400">보이지 않는 연결고리</span>를<br />
              벡터(Vector)로 찾아냅니다.
            </h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              룰메이커스의 AI는 문항의 텍스트와 이미지를 3차원 공간상의 좌표(Vector)로 변환합니다. 
              단순히 단어가 겹치는 것이 아니라, <span className="text-white">문항의 맥락(Context)과 의도가 유사한 문항</span>을 
              98%의 정확도로 찾아냅니다.
            </p>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="text-2xl font-bold text-white mb-1">98.2%</div>
                <div className="text-sm text-slate-400">유사 문항 매칭 정확도</div>
              </div>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="text-2xl font-bold text-white mb-1">0.3s</div>
                <div className="text-sm text-slate-400">유사 문항 검색 속도</div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* Feature 3: IR/Investment Section */}
      <section className="py-32 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Why RuleMakers?</h2>
          <p className="text-slate-400">데이터가 쌓일수록 누구도 따라올 수 없는 기술 장벽을 만듭니다.</p>
        </div>

        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <GitMerge className="w-8 h-8 text-blue-400" />,
              title: "Data Moat",
              desc: "매일 수천 건씩 쌓이는 사용자 풀이 데이터와 문항 벡터가 결합되어, 시간이 지날수록 AI 모델은 독보적으로 똑똑해집니다."
            },
            {
              icon: <ScanSearch className="w-8 h-8 text-purple-400" />,
              title: "Auto-Clustering",
              desc: "신규 문항이 입력되면 AI가 자동으로 군집(Cluster #29)을 할당하고 난이도를 예측합니다. 운영 비용을 획기적으로 낮춥니다."
            },
            {
              icon: <Cpu className="w-8 h-8 text-emerald-400" />,
              title: "Scalability",
              desc: "과학뿐만 아니라 수학, 사회 등 타 과목으로 확장 가능한 범용적인 문항 분석 엔진(Engine) 구조를 갖추고 있습니다."
            }
          ].map((card, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="p-8 bg-slate-800/30 border border-slate-700 rounded-2xl hover:bg-slate-800/50 hover:border-slate-600 transition-all"
            >
              <div className="mb-6 p-3 bg-slate-900 rounded-lg inline-block shadow-lg">
                {card.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{card.title}</h3>
              <p className="text-slate-400 leading-relaxed text-sm">{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}