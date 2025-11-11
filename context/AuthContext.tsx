// context/AuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onIdTokenChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase"; 
import { doc, getDoc } from "firebase/firestore";

// ... (AuthUser, AuthContextType 인터페이스는 동일) ...
export interface AuthUser extends User {
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isFirstLogin: boolean | null; 
  checkFirstLogin: (user: User) => Promise<boolean>; 
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isFirstLogin: null,
  checkFirstLogin: async () => false,
});


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      setIsFirstLogin(null); 

      if (firebaseUser) {
        
        // --- (수정된 로직) ---
        // 1. Firestore를 *먼저* 확인해서 첫 로그인인지 판단합니다.
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        const isNew = !docSnap.exists();
        setIsFirstLogin(isNew);
        
        // 2. 만약 첫 로그인(isNew)이라면, 
        //    캐시를 무시(true)하고 새 토큰을 강제로 가져옵니다.
        //    (백엔드 Functions가 설정한 custom claim을 반영하기 위함)
        console.log(`토큰 확인 중. 첫 로그인: ${isNew}. 강제 새로고침: ${isNew}`);
        const idTokenResult = await firebaseUser.getIdTokenResult(isNew); // <-- 핵심 수정!
        
        const isAdmin = idTokenResult.claims.admin === true;
        console.log(`관리자 상태: ${isAdmin}`);
        // --- (수정 끝) ---

        const authUser: AuthUser = { ...firebaseUser, isAdmin: isAdmin };
        setUser(authUser);

      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); 
  }, []);

  // 이 함수는 이제 profile/setup 페이지에서 '첫 로그인' 상태를 false로 갱신할 때만 사용됩니다.
  const checkFirstLogin = async (firebaseUser: User): Promise<boolean> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(userDocRef);
    
    const isNew = !docSnap.exists();
    setIsFirstLogin(isNew); // 컨텍스트 상태 갱신
    return isNew;
  };

  const value = {
    user,
    loading,
    isFirstLogin,
    checkFirstLogin,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} 
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};