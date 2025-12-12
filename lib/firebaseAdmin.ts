// lib/firebaseAdmin.ts

import admin from "firebase-admin";

// Admin SDK가 이미 초기화되었는지 확인 (중복 초기화 방지)
if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  try {
    // 1. 로컬 환경 (환경 변수에 키가 있는 경우)
    if (privateKey && clientEmail) {
      console.log("[FirebaseAdmin] Initializing with Private Key (Local Mode)");
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } 
    // 2. 배포 환경 (Cloud Run / Firebase Hosting)
    else {
      console.log("[FirebaseAdmin] Initializing with ADC/FIREBASE_CONFIG (Cloud Mode)");
      // Cloud Run은 FIREBASE_CONFIG 환경 변수가 있으면 
      // 파라미터 없이 initializeApp()만 호출해도 알아서 인증과 버킷을 연결합니다.
      admin.initializeApp(); 
    }
    
    console.log("[FirebaseAdmin] Initialization Successful ✅");
  } catch (error) {
    // [중요] 에러를 숨기지 않고 출력하며, 서버를 중단시켜 원인을 파악하게 함
    console.error("[FirebaseAdmin] Initialization Failed ❌", error);
    throw error; 
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const adminStorage = admin.storage();

export default admin;