// lib/firebaseAdmin.ts

import admin from "firebase-admin";

// Admin SDK가 이미 초기화되었는지 확인 (중복 초기화 방지)
if (!admin.apps.length) {
  // 1. 환경 변수 가져오기
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  // 2. 초기화 로직 분기
  // Cloud Run 등 배포 환경에서는 'applicationDefault()'를 사용하여 IAM 권한을 자동 적용합니다.
  // 로컬 등 키 파일이 꼭 필요한 경우에만 'cert()'를 사용합니다.
  
  if (privateKey && clientEmail) {
    // [로컬/직접 키 설정] Private Key가 있는 경우
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: clientEmail,
          // 개행 문자(\n) 처리 보강
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        storageBucket: storageBucket,
      });
    } catch (error) {
      console.error("Firebase Admin Key Initialize Failed:", error);
    }
  } else {
    // [Cloud Run / 배포 환경] 자동 인증 (권한 부여한 계정 사용)
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      storageBucket: storageBucket,
    });
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export default admin;