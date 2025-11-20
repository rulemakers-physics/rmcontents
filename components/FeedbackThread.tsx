// components/FeedbackThread.tsx

"use client";

import { useState, useEffect, useRef, useMemo, FormEvent, KeyboardEvent, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { db, storage } from "@/lib/firebase";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { PaperAirplaneIcon, PaperClipIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface FeedbackMessage {
  id: string;
  text: string;
  authorType: "admin" | "instructor";
  authorName: string;
  authorId: string;
  timestamp: Timestamp | null; 
  // 첨부파일 정보
  fileUrl?: string;
  fileName?: string;
  fileType?: "image" | "file";
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
  
  // 파일 첨부 상태
  const [attachment, setAttachment] = useState<File | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  // 완료 상태여도 채팅은 가능해야 함
  const isJobLocked = requestStatus === "rejected";

  useEffect(() => {
    if (!requestId) return;

    const feedbackColRef = collection(db, "requests", requestId, "feedback");
    const q = query(feedbackColRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: FeedbackMessage[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as FeedbackMessage);
      });
      setMessages(msgs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [requestId]);

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

  const unreadMessageIds = useMemo(() => {
    if (!user) return new Set();
    const myMessages = messages.filter(m => m.authorId === user.uid && m.timestamp);
    const unreadMsgs = myMessages.slice(myMessages.length - otherUnreadCount);
    return new Set(unreadMsgs.map(m => m.id));
  }, [messages, otherUnreadCount, user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, attachment]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const handleSubmitMessage = async (e: FormEvent | KeyboardEvent) => {
    e.preventDefault();
    if ((newMessage.trim() === "" && !attachment) || !user || isSending || isJobLocked) return;

    setIsSending(true);

    try {
      let authorName = user.isAdmin ? "관리자" : user.displayName || "강사";
      if (!user.isAdmin && !user.displayName) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          authorName = userDoc.data().name || "강사";
        }
      }

      // 파일 업로드 로직
      let fileUrl = null;
      let fileType = null;
      let fileName = null;

      if (attachment) {
         const storageRef = ref(storage, `feedback/${requestId}/${Date.now()}_${attachment.name}`);
         await uploadBytes(storageRef, attachment);
         fileUrl = await getDownloadURL(storageRef);
         fileType = attachment.type.startsWith('image/') ? 'image' : 'file';
         fileName = attachment.name;
      }

      const feedbackColRef = collection(db, "requests", requestId, "feedback");
      await addDoc(feedbackColRef, {
        text: newMessage,
        authorType: user.isAdmin ? "admin" : "instructor",
        authorName: authorName,
        authorId: user.uid,
        timestamp: serverTimestamp(),
        fileUrl,
        fileType,
        fileName
      });

      const requestDocRef = doc(db, "requests", requestId);
      if (user.isAdmin) {
        await updateDoc(requestDocRef, { unreadCountInstructor: increment(1) });
      } else {
        await updateDoc(requestDocRef, { unreadCountAdmin: increment(1) });
      }

      setNewMessage("");
      setAttachment(null);

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

  const getFormattedDate = (date: Date) => {
    return date.toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric", weekday: "long",
    });
  };

  const isNewDay = (current: Timestamp | null, prev: Timestamp | null) => {
    if (!current || typeof current.toDate !== 'function') return false; 
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

            if (!msg.timestamp) {
                return <div key={msg.id} className="text-center text-xs text-gray-400">* 메시지 전송 중...</div>;
            }

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-gray-300 text-gray-700 text-[10px] px-3 py-1 rounded-full shadow-sm">
                      {getFormattedDate(msg.timestamp.toDate())}
                    </span>
                  </div>
                )}

                <div className={`flex w-full mb-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex items-end gap-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}>
                    <div className="flex flex-col items-end justify-end h-full pb-0.5">
                      {isUnread && <span className="text-[10px] font-bold text-yellow-500 mb-0.5">1</span>}
                      <span className="text-[10px] text-gray-500 min-w-fit">
                        {msg.timestamp.toDate().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: true })}
                      </span>
                    </div>
                    
                    <div className={`flex flex-col max-w-[90%] md:max-w-[85%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                      {!isCurrentUser && <span className="text-xs text-gray-600 mb-1 px-1">{msg.authorName}</span>}

                      <div className={`relative px-4 py-3 text-sm whitespace-pre-wrap shadow-sm rounded-xl ${
                          isCurrentUser ? "bg-blue-600 text-white rounded-br-none" : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                        }`}>
                        {msg.text}
                        
                        {/* 첨부파일 표시 */}
                        {msg.fileType === 'image' && msg.fileUrl && (
                          <img src={msg.fileUrl} alt="첨부 이미지" className="mt-2 max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity" onClick={()=>window.open(msg.fileUrl, '_blank')} />
                        )}
                        {msg.fileType === 'file' && msg.fileUrl && (
                          <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center mt-2 p-2 rounded bg-opacity-10 ${isCurrentUser ? 'bg-white text-blue-100' : 'bg-gray-100 text-blue-600'} hover:underline`}>
                             <PaperClipIcon className="h-4 w-4 mr-2"/>
                             <span className="truncate max-w-[150px]">{msg.fileName || "첨부파일"}</span>
                          </a>
                        )}
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
        {/* 첨부파일 미리보기 */}
        {attachment && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-gray-100 rounded-lg w-fit">
             <span className="text-xs text-gray-600 max-w-[200px] truncate">{attachment.name}</span>
             <button onClick={() => setAttachment(null)} className="text-gray-400 hover:text-red-500">
               <XMarkIcon className="h-4 w-4" />
             </button>
          </div>
        )}

        <form onSubmit={handleSubmitMessage} className="relative flex items-end gap-2">
          {/* 파일 첨부 버튼 */}
          <label className={`p-2 rounded-full cursor-pointer hover:bg-gray-100 transition-colors ${isJobLocked ? 'opacity-50 cursor-not-allowed' : ''}`}>
             <PaperClipIcon className="h-6 w-6 text-gray-500" />
             <input 
               type="file" 
               className="hidden" 
               onChange={handleFileSelect} 
               accept="image/*,.pdf"
               disabled={isJobLocked}
             />
          </label>

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
            disabled={isSending || (newMessage.trim() === "" && !attachment) || isJobLocked}
            className={`absolute right-2 bottom-2 p-1.5 rounded-md transition-colors ${
              (newMessage.trim() !== "" || attachment)
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