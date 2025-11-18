// components/FeedbackThread.tsx

"use client";

import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
  getDoc,
  updateDoc,
  increment
} from "firebase/firestore";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface FeedbackMessage {
  id: string;
  text: string;
  authorType: "admin" | "instructor";
  authorName: string;
  authorId: string;
  timestamp: Timestamp | null; 
}

interface FeedbackThreadProps {
  requestId: string;
  requestStatus: "requested" | "in_progress" | "completed" | "rejected";
}

export default function FeedbackThread({ 
  requestId, 
  requestStatus 
}: FeedbackThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUnreadCount, setOtherUnreadCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isJobLocked = requestStatus === "rejected";

  // 1. 메시지 목록 불러오기
  useEffect(() => {
    if (!requestId) return;

    const feedbackColRef = collection(db, "requests", requestId, "feedback");
    const q = query(feedbackColRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const msgs: FeedbackMessage[] = [];
        querySnapshot.forEach((doc) => {
          msgs.push({ id: doc.id, ...doc.data() } as FeedbackMessage);
        });
        setMessages(msgs);
        setIsLoading(false);
      },
      (error) => {
        console.error("피드백 로딩 중 에러:", error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [requestId]);

  // 2. 읽음 상태 관리
  useEffect(() => {
    if (!user || !requestId) return;

    const reqRef = doc(db, "requests", requestId);
    const unsubscribe = onSnapshot(reqRef, (snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      const myUnreadField = user.isAdmin ? 'unreadCountAdmin' : 'unreadCountInstructor';
      if (data[myUnreadField] > 0) {
        updateDoc(reqRef, { [myUnreadField]: 0 });
      }

      const otherUnreadField = user.isAdmin ? 'unreadCountInstructor' : 'unreadCountAdmin';
      setOtherUnreadCount(data[otherUnreadField] || 0);
    });

    return () => unsubscribe();
  }, [requestId, user]);

  // 3. 안 읽은 메시지 ID 계산 ('1' 표시용)
  const unreadMessageIds = useMemo(() => {
    if (!user) return new Set();
    const myMessages = messages.filter(m => m.authorId === user.uid && m.timestamp);
    const unreadMsgs = myMessages.slice(myMessages.length - otherUnreadCount);
    return new Set(unreadMsgs.map(m => m.id));
  }, [messages, otherUnreadCount, user]);

  // 4. 스크롤 자동 이동
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 5. 메시지 전송 (생략된 로직은 유효함)
  const handleSubmitMessage = async (e: FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user || isSending || isJobLocked) return;

    setIsSending(true);

    try {
      let authorName = user.isAdmin ? "관리자" : user.displayName || "강사";
      if (!user.isAdmin && !user.displayName) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          authorName = userDoc.data().name || "강사";
        }
      }

      const feedbackColRef = collection(db, "requests", requestId, "feedback");
      await addDoc(feedbackColRef, {
        text: newMessage,
        authorType: user.isAdmin ? "admin" : "instructor",
        authorName: authorName,
        authorId: user.uid,
        timestamp: serverTimestamp(),
      });

      const requestDocRef = doc(db, "requests", requestId);
      if (user.isAdmin) {
        await updateDoc(requestDocRef, { unreadCountInstructor: increment(1) });
      } else {
        await updateDoc(requestDocRef, { unreadCountAdmin: increment(1) });
      }

      setNewMessage(""); 
    } catch (error) {
      console.error("전송 실패:", error);
    }
    setIsSending(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitMessage(e);
    }
  };


  // 6. [FIXED] 날짜 구분선 및 유효성 검사 헬퍼
  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    });
  };

  const isNewDay = (current: Timestamp | null, prev: Timestamp | null) => {
    // [FIX] current가 유효한 Timestamp 객체인지 확인 (runtime error 방지)
    if (!current || typeof current.toDate !== 'function') return false; 
    
    // [FIX] prev가 유효한 Timestamp 객체인지 확인
    if (!prev || typeof prev.toDate !== 'function') return true; 

    const currDate = current.toDate();
    const prevDate = prev.toDate();
    
    return (
      currDate.getDate() !== prevDate.getDate() ||
      currDate.getMonth() !== prevDate.getMonth() ||
      currDate.getFullYear() !== prevDate.getFullYear()
    );
  };


  if (isLoading) return <div className="p-8 text-center text-gray-500 animate-pulse">대화 내용을 불러오는 중...</div>;

  return (
    <div className="flex flex-col h-[600px] rounded-xl bg-white shadow-lg border border-gray-200 overflow-hidden">
      {/* 헤더 */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          💬 1:1 실시간 소통
        </h3>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isJobLocked ? 'bg-gray-200 text-gray-500' : 'bg-green-100 text-green-700'
        }`}>
          {isJobLocked ? '대화 종료' : '실시간 연결됨'}
        </span>
      </div>
      
      {/* 메시지 목록 */}
      <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50"> 
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-500 space-y-2 opacity-70">
            <PaperAirplaneIcon className="h-12 w-12" />
            <p className="text-sm">아직 대화 내용이 없습니다.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.authorId === user?.uid; 
            const isUnread = isCurrentUser && unreadMessageIds.has(msg.id);
            const showDate = msg.timestamp && isNewDay(msg.timestamp, index > 0 ? messages[index - 1].timestamp : null);

            // Timestamp가 null인 경우 (전송 직후) 임시 메시지 표시
            if (!msg.timestamp) {
                return (
                    <div key={msg.id} className="text-center text-xs text-gray-400">
                        * 메시지 전송 중...
                    </div>
                );
            }

            return (
              <div key={msg.id}>
                
                {/* 날짜 구분선 */}
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-300 text-gray-700 text-[10px] px-3 py-1 rounded-full shadow-sm">
                      {getFormattedDate(msg.timestamp.toDate())}
                    </span>
                  </div>
                )}

                {/* 메시지 버블 및 레이아웃 */}
                <div className={`flex w-full mb-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* 시간 및 읽음 표시 컨테이너 */}
                    <div className="flex flex-col items-end justify-end h-full pb-0.5">
                      {/* 읽음 표시 */}
                      {isUnread && (
                        <span className="text-[10px] font-bold text-yellow-500 mb-0.5">
                          1
                        </span>
                      )}
                      {/* 시간 */}
                      <span className="text-[10px] text-gray-500 min-w-fit">
                        {msg.timestamp.toDate().toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true
                        })}
                      </span>
                    </div>
                    
                    {/* 메시지 내용 영역 (너비 확장) */}
                    <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                      {/* 이름 (상대방일 때만 표시) */}
                      {!isCurrentUser && (
                        <span className="text-xs text-gray-600 mb-1 px-1">
                          {msg.authorName}
                        </span>
                      )}

                      {/* 말풍선 */}
                      <div
                        className={`relative px-4 py-3 text-sm whitespace-pre-wrap shadow-sm rounded-xl ${
                          isCurrentUser
                            ? "bg-blue-600 text-white rounded-br-none" // 내 메시지 (파란색)
                            : "bg-white text-gray-800 border border-gray-200 rounded-bl-none" // 상대 메시지 (흰색)
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 입력 폼 */}
      <div className="bg-white p-4 border-t border-gray-200">
        <form onSubmit={handleSubmitMessage} className="relative flex items-end gap-2">
          <textarea
            rows={1}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 80)}px`;
            }}
            onKeyDown={handleKeyDown}
            disabled={isSending || isJobLocked}
            placeholder={isJobLocked ? "대화가 종료되었습니다." : "메시지 입력 (Enter: 전송)"}
            className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 py-3 pl-4 pr-12 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 scrollbar-hide"
            style={{ minHeight: "44px", maxHeight: "80px" }}
          />
          <button
            type="submit"
            disabled={isSending || newMessage.trim() === "" || isJobLocked}
            className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${
              newMessage.trim() !== "" 
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-400"
            }`}
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}