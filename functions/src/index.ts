// functions/src/index.ts

import * as functions from "firebase-functions/v1"; 
import admin from "firebase-admin"; 
import axios from "axios"; // [신규] 슬랙 연동을 위한 axios 임포트

// Firebase Admin SDK 초기화
admin.initializeApp(); 

/**
 * [트리거] 새로운 사용자 계정이 생성될 때마다 자동으로 실행됩니다. (v1 방식)
 * (기존 코드 원본 유지)
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


// --- [신규] 새 작업 요청 시 슬랙 알림 전송 (v1 구문) ---
export const sendSlackNotificationOnNewRequest = functions.firestore
  .document("requests/{requestId}")
  .onCreate(async (snap, context) => {
    const requestId = context.params.requestId;
    const requestData = snap.data();

    if (!requestData) {
      functions.logger.warn(`[Slack] 데이터 없음: ${requestId}`);
      return null;
    }

    functions.logger.info(`[Slack] 새 작업 요청 감지: ${requestId}`);

    // 1. 환경 변수에서 Webhook URL 가져오기
    // (로컬 .env 파일 또는 Firebase config 사용)
    const webhookUrl = process.env.SLACK_WEBHOOK_URL || functions.config().slack.webhook_url;

    if (!webhookUrl) {
      functions.logger.error(
        "[Slack] Webhook URL이 Firebase 환경 변수(slack.webhook_url) 또는 .env(SLACK_WEBHOOK_URL)에 설정되지 않았습니다."
      );
      return null;
    }

    // 2. 슬랙 메시지 포맷 (Slack Block Kit)
    const slackMessage = {
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: "🔔 새 작업 요청이 접수되었습니다!",
            emoji: true,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*요청 제목:*\n${requestData.title}`,
            },
            {
              type: "mrkdwn",
              text: `*요청 강사:*\n${requestData.instructorName} (${requestData.academy})`,
            },
            {
              type: "mrkdwn",
              text: `*컨텐츠 종류:*\n${requestData.contentKind}`,
            },
            {
              type: "mrkdwn",
              text: `*마감일:*\n${requestData.deadline}`,
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "어드민에서 확인하기",
                emoji: true,
              },
              // [중요] 'YOUR_PROJECT_URL'을 실제 배포된 웹사이트의 도메인으로 변경하세요.
              url: `https://rmcontents1.web.app/admin/request/${requestId}`,
              style: "primary",
            },
          ],
        },
        {
          type: "divider",
        },
      ],
    };

    // 3. 슬랙으로 POST 요청 전송
    try {
      await axios.post(webhookUrl, slackMessage);
      functions.logger.info(`[Slack] 알림 전송 성공: ${requestId}`);
      return null;
    } catch (error) {
      functions.logger.error(
        `[Slack] 알림 전송 실패: ${requestId}`,
        error
      );
      return null;
    }
  });
// --- [신규] 여기까지 ---
/**
 * [수정된 트리거] 피드백 메시지 알림 (별도 채널 지원)
 */
export const sendSlackNotificationOnNewFeedback = functions.firestore
  .document("requests/{requestId}/feedback/{messageId}")
  .onCreate(async (snap, context) => {
    const feedbackData = snap.data();
    const requestId = context.params.requestId;

    // 1. 관리자가 보낸 메시지는 알림 스킵
    if (feedbackData.authorType === "admin") {
      return null;
    }

    // 2. 부모 요청 문서 데이터 가져오기
    const requestDoc = await admin.firestore().collection("requests").doc(requestId).get();
    const requestData = requestDoc.data();

    if (!requestData) {
       functions.logger.warn(`[Slack] 요청 데이터 없음: ${requestId}`);
       return null;
    }

    // 3. [핵심] 피드백 전용 Webhook URL을 우선적으로 확인
    // 환경 변수(SLACK_FEEDBACK_WEBHOOK_URL) 또는 Firebase Config(slack.feedback_webhook_url) 확인
    // 없으면 기본 URL(SLACK_WEBHOOK_URL)로 폴백(Fallback)
    const webhookUrl = 
      process.env.SLACK_FEEDBACK_WEBHOOK_URL || 
      functions.config().slack.feedback_webhook_url || 
      process.env.SLACK_WEBHOOK_URL || 
      functions.config().slack.webhook_url;

    if (!webhookUrl) {
      functions.logger.error("[Slack] Webhook URL이 설정되지 않았습니다.");
      return null;
    }

    // 4. 슬랙 메시지 구성
    const slackMessage = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "💬 *새로운 메시지가 도착했습니다!*"
          }
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*요청 제목:*\n${requestData.title}`
            },
            {
              type: "mrkdwn",
              text: `*작성자:*\n${feedbackData.authorName}`
            }
          ]
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*내용:*\n${feedbackData.text}`
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "답장하러 가기",
                emoji: true
              },
              url: `https://rmcontents1.web.app/admin/request/${requestId}`,
              style: "primary"
            }
          ]
        }
      ]
    };

    // 5. 전송
    try {
      await axios.post(webhookUrl, slackMessage);
      functions.logger.info(`[Slack] 피드백 알림 전송 성공: ${requestId}`);
    } catch (error) {
      functions.logger.error(`[Slack] 피드백 알림 전송 실패`, error);
    }
    
    return null;
  });