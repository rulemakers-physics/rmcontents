// context/AuthContext.tsx

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, onIdTokenChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { UserData } from "@/types/user"; // types/user.ts에서 정의한 타입 임포트

export interface AuthUser extends User {
  isAdmin?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  userData: UserData | null; // [신규] DB 유저 정보 (플랜 등)
  loading: boolean;
  isFirstLogin: boolean | null;
  checkFirstLogin: (user: User) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isFirstLogin: null,
  checkFirstLogin: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null); // [신규]
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);

  // 1. [기존 로직 유지] 인증 상태 및 토큰 관리
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        // --- 기존 로직 시작 ---
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        const isNew = !docSnap.exists();
        setIsFirstLogin(isNew);
        
        // 첫 로그인 시 토큰 강제 갱신 (관리자 권한 즉시 반영용)
        const idTokenResult = await firebaseUser.getIdTokenResult(isNew); 
        const isAdmin = idTokenResult.claims.admin === true;
        // --- 기존 로직 끝 ---

        const authUser: AuthUser = { ...firebaseUser, isAdmin: isAdmin };
        setUser(authUser);
      } else {
        setUser(null);
        setUserData(null);
        setIsFirstLogin(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. [신규 로직 추가] DB 실시간 리스너 (구독 플랜 변경 감지)
  useEffect(() => {
    if (!user) return; // 유저가 없으면 실행하지 않음

    // 유저가 로그인 상태일 때만 Firestore 실시간 리스너 연결
    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        // DB 데이터가 변경될 때마다 userData 상태 업데이트
        setUserData(docSnap.data() as UserData);
      }
    });

    // 언마운트 시 리스너 해제
    return () => unsubscribe();
  }, [user]); // user가 변경될 때마다(로그인/로그아웃) 실행

  
  // --- (기존 함수 유지) ---
  const checkFirstLogin = async (firebaseUser: User): Promise<boolean> => {
    const userDocRef = doc(db, "users", firebaseUser.uid);
    const docSnap = await getDoc(userDocRef);
    const isNew = !docSnap.exists();
    setIsFirstLogin(isNew);
    return isNew;
  };

  const value = {
    user,
    userData, // [신규] Provider에 추가
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