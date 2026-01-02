// components/MarketingChatbot.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChatBubbleLeftRightIcon, 
  XMarkIcon, 
  UserIcon,
  ArrowTopRightOnSquareIcon
} from "@heroicons/react/24/solid";

// 자주 묻는 질문 시나리오
const FAQ_SCENARIOS = [
  {
    id: "pricing",
    label: "💰 이용 요금",
    answer: "Basic Plan은 월 198,000원이며, 현재 런칭 프로모션으로 **첫 달 무료 체험**이 가능합니다."
  },
  {
    id: "refund",
    label: "🛡️ 환불 규정",
    answer: "결제일로부터 7일 이내 미사용 시 전액 환불 가능합니다.\n\n이후에는 경과 기간에 따라 차등 환불되며, 15일 이후에는 환불이 불가합니다."
  },
  {
    id: "custom",
    label: "✍️ 맞춤 제작 문의",
    answer: "Maker's Plan은 학원 전용 1:1 맞춤 제작 서비스입니다.\n학교별 기출 분석부터 교재 제작까지 전담 연구원이 배정됩니다.\n\n상세 견적은 [도입 문의]를 통해 상담해주세요."
  },
  {
    id: "support",
    label: "🙋 상담원 연결",
    action: "link",
    url: "http://pf.kakao.com/_rxgPmn" // 실제 카카오 채널 링크
  },
  // [테스트용] 질문이 많아져도 UI가 깨지지 않는지 확인하기 위한 추가 더미
  {
    id: "guide",
    label: "📚 이용 가이드",
    answer: "상단 메뉴의 '문제은행(Maker)' 탭에서 직접 시험지를 제작해 보실 수 있습니다."
  }
];

interface Message {
  id: string;
  text: string;
  sender: "bot" | "user";
  timestamp: Date;
}

export default function MarketingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "안녕하세요! RuleMakers 챗봇입니다. 👋\n무엇을 도와드릴까요?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 스크롤 자동 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  const handleScenarioClick = (scenario: typeof FAQ_SCENARIOS[0]) => {
    // 1. 유저 메시지 추가
    const userMsg: Message = {
      id: Date.now().toString(),
      text: scenario.label,
      sender: "user",
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);

    // 2. 외부 링크인 경우
    if (scenario.action === "link" && scenario.url) {
      window.open(scenario.url, "_blank");
      return;
    }

    // 3. 봇 응답 (타이핑 효과)
    setIsTyping(true);
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: scenario.answer || "잠시만 기다려주세요.",
        sender: "bot",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 600 + Math.random() * 500); // 0.6~1.1초 딜레이
  };

  return (
    <>
      {/* 1. 플로팅 버튼 (FAB) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-xl shadow-slate-900/30 hover:bg-slate-800 transition-colors ring-4 ring-white"
          >
            <ChatBubbleLeftRightIcon className="h-7 w-7" />
            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 2. 채팅 창 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            // [수정] 높이를 고정(h-[600px])하여 내용물에 따라 창 크기가 변하지 않게 함
            className="fixed bottom-6 right-6 z-[60] flex w-[360px] h-[600px] max-h-[80vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5"
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <UserIcon className="h-5 w-5 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">RuleMakers 챗봇</h3>
                  <p className="text-[10px] text-slate-300 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400"></span>
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-slate-300" />
              </button>
            </div>

            {/* Chat Body */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto bg-slate-50 p-4 custom-scrollbar"
            >
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white text-slate-700 rounded-bl-none border border-slate-100"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-1 rounded-2xl rounded-bl-none bg-white px-4 py-3 border border-slate-100">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* [수정] FAQ Options (가로 스크롤 방식) */}
            <div className="border-t border-slate-100 bg-white p-3 shrink-0">
              <p className="mb-2 text-xs font-bold text-slate-400 uppercase px-1">자주 묻는 질문</p>
              
              {/* 가로 스크롤 컨테이너 */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {FAQ_SCENARIOS.map((faq) => (
                  <button
                    key={faq.id}
                    onClick={() => handleScenarioClick(faq)}
                    className="flex-shrink-0 flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95 whitespace-nowrap"
                  >
                    <span>{faq.label}</span>
                    {faq.action === 'link' && (
                       <ArrowTopRightOnSquareIcon className="h-3 w-3 opacity-50" />
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-1 text-center border-t border-slate-50 pt-2">
                 <p className="text-[10px] text-slate-300">
                    RuleMakers Customer Service
                 </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}