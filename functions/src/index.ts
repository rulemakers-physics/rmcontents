// functions/src/index.ts

import * as functions from "firebase-functions/v1"; 
import admin from "firebase-admin"; // <-- 수정된 부분

// Firebase Admin SDK 초기화
admin.initializeApp(); // 이제 이 코드가 정상적으로 동작합니다.

/**
 * [트리거] 새로운 사용자 계정이 생성될 때마다 자동으로 실행됩니다. (v1 방식)
 *
 * 이메일 도메인을 확인하여 '@rulemakers.co.kr'로 끝나면
 * 해당 사용자에게 'admin: true'라는 커스텀 권한(Claim)을 부여합니다.
 */
export const setAdminClaimOnUserCreate = functions.auth
  .user()
  .onCreate(async (user) => {
    // v1에서는 'user' 객체를 직접 받습니다.

    // 1. 사용자 이메일이 있는지, 우리가 찾는 도메인이 맞는지 확인
    if (user.email && user.email.endsWith("@rulemakers.co.kr")) {
      console.log(`관리자 권한 부여 시도: ${user.email}`);

      try {
        // 2. 사용자에게 'admin: true' 커스텀 클레임 설정
        await admin.auth().setCustomUserClaims(user.uid, { admin: true });

        console.log(
          `성공: ${user.email} 사용자에게 관리자 권한이 부여되었습니다.`
        );
        return; // 관리자 작업 완료 후 함수 종료
        
      } catch (error) {
        console.error(
          `실패: ${user.email} 관리자 권한 부여 중 에러 발생`,
          error
        );
        return;
      }
    }
  });