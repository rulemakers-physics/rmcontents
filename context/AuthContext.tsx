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
  isUserDataLoaded: boolean; // [추가] DB 데이터 로딩 완료 여부
  checkFirstLogin: (user: User) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isFirstLogin: null,
  isUserDataLoaded: false, // [추가] 초기값 false
  checkFirstLogin: async () => false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null); // [신규]
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState<boolean | null>(null);
  // [추가] 유저 DB 데이터 로딩 상태
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);

  // 1. 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      setLoading(true); // 인증 상태 변경 시 로딩 시작
      
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(userDocRef);
        const isNew = !docSnap.exists();
        setIsFirstLogin(isNew);
        
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const isAdmin = idTokenResult.claims.admin === true;

        const authUser = firebaseUser as AuthUser;
        authUser.isAdmin = isAdmin;
        setUser(authUser);
        
        // [중요] 로그인 직후에는 아직 userData가 없으므로 loaded는 false 유지
      } else {
        setUser(null);
        setUserData(null);
        setIsFirstLogin(null);
        setIsUserDataLoaded(true); // [중요] 비로그인 상태면 데이터 로딩은 끝난 것임 (없으니까)
      }
      setLoading(false); // 인증 체크 끝
    });

    return () => unsubscribe();
  }, []);

  // 2. DB 실시간 리스너
  useEffect(() => {
    if (!user) return; 

    // 유저가 있을 때만 실행
    setIsUserDataLoaded(false); // 리스너 연결 시작 전 false로

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as UserData);
      }
      // [핵심] 데이터를 한 번이라도 받아오면 로딩 완료 처리
      setIsUserDataLoaded(true);
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
    isUserDataLoaded, // [추가] 내보내기
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