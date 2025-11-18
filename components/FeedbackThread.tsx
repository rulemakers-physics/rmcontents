// components/FeedbackThread.tsx

"use client";

import { useState, useEffect, FormEvent } from "react";
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
} from "firebase/firestore";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

interface FeedbackMessage {
  id: string;
  text: string;
  authorType: "admin" | "instructor";
  authorName: string;
  authorId: string; // [수정] isCurrentUser 비교를 위해 authorId 추가
  timestamp: Timestamp;
}

interface FeedbackThreadProps {
  requestId: string;
  requestStatus: "requested" | "in_progress" | "completed" | "rejected"; // [신규]
}

export default function FeedbackThread({ 
  requestId, 
  requestStatus // [신규]
}: FeedbackThreadProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // [신규] 작업이 완료되었는지 여부
  const isJobCompleted = requestStatus === "completed" || requestStatus === "rejected";

  // 1. 실시간으로 피드백(메모) 목록 불러오기
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

    // 컴포넌트 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [requestId]);

  // 2. 새 메시지(메모) 전송 핸들러
  const handleSubmitMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !user || isSending || isJobCompleted) return;

    setIsSending(true);

    try {
      // (선택) user.name이 AuthUser에 없을 경우 Firestore 'users' 컬렉션에서 가져옴
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
        authorId: user.uid, // [수정] authorId 저장
        timestamp: serverTimestamp(),
      });

      setNewMessage(""); // 입력창 비우기
    } catch (error) {
      console.error("메시지 전송 실패:", error);
      alert("메시지 전송에 실패했습니다.");
    }
    setIsSending(false);
  };

  if (isLoading) {
    return <div className="p-4 text-center text-gray-500">메모 로딩 중...</div>;
  }

  return (
    <div className="rounded-lg bg-white shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 p-6 border-b border-gray-200">
        작업 피드백 (메모)
      </h3>
      
      {/* 메시지 목록 */}
      <div className="max-h-72 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">
            아직 주고받은 메모가 없습니다.
          </p>
        ) : (
          messages.map((msg) => {
            // [수정] isCurrentUser 비교
            const isCurrentUser = msg.authorId === user?.uid; 
            
            return (
              <div
                key={msg.id}
                className={`flex ${
                  isCurrentUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-lg px-4 py-3 ${
                    isCurrentUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold">
                      {msg.authorName}
                    </span>
                    <span className="text-xs opacity-80">
                      {msg.timestamp?.toDate().toLocaleString("ko-KR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 메시지 입력 폼 */}
      <form onSubmit={handleSubmitMessage} className="border-t border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <textarea
            rows={2}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            // [수정] disabled 로직
            disabled={isSending || isJobCompleted} 
            placeholder={
              // [수정] user.status -> requestStatus
              isJobCompleted
                ? (requestStatus === 'completed' ? "완료된 작업입니다." : "반려된 작업입니다.")
                : "수정 요청이나 메모를 입력하세요..."
            }
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
          />
          <button
            type="submit"
            // [수정] disabled 로직
            disabled={isSending || newMessage.trim() === "" || isJobCompleted}
            className="flex-shrink-0 rounded-full p-2.5 text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}