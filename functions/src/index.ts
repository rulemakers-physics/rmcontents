// functions/src/index.ts

import * as functions from "firebase-functions/v1"; 
import admin from "firebase-admin"; 
import axios from "axios"; // [신규] 슬랙 연동을 위한 axios 임포트

// Firebase Admin SDK 초기화
admin.initializeApp(); 

// 연구원 이름 <-> 슬랙 Member ID 매핑
// [중요] 실제 슬랙 멤버 ID로 교체해야 멘션이 작동합니다.
const RESEARCHER_SLACK_IDS: Record<string, string> = {
  "김성배": "김성배",
  "김호권": "김호권",
  "김희경": "김호권",
  "노유민": "노유민",
  "이민지": "이민지",
  "이정한": "이정한",
  "이호열": "이호열",
  "최명수": "최명수"
};

/**
 * [트리거] 새로운 사용자 계정이 생성될 때마다 자동으로 실행됩니다. (v1 방식)
 * (기존 코드 원본 유지)
 *
 * 이메일 도메인을 확인하여 '@rulemakers.co.kr'로 끝나면
 * 해당 사용자에게 'admin: true'라는 커스텀 권한(Claim)을 부여합니다.
 */
export const setAdminClaimOnUserCreate = functions
  .runWith({ timeoutSeconds: 60 }) // [수정] 실행 시간 60초로 연장
  .auth
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

/**
 * [신규 트리거] 프로필 설정(DB 생성) 시 관리자 이메일 체크 및 권한 부여
 * - 상황: DB를 날리고 재가입하거나, Auth 트리거가 씹혔을 때를 대비한 2차 안전장치입니다.
 * - users/{uid} 문서가 생성될 때 이메일을 확인하여 관리자라면 role을 강제로 'admin'으로 수정합니다.
 */
export const grantAdminRoleOnProfileCreate = functions
  .runWith({ timeoutSeconds: 60 })
  .firestore
  .document("users/{uid}")
  .onCreate(async (snap, context) => {
    const newData = snap.data();
    const uid = context.params.uid;

    // 1. 이메일 도메인 확인
    if (newData.email && newData.email.endsWith("@rulemakers.co.kr")) {
      functions.logger.info(`[Admin Auto-Grant] 관리자 이메일 감지: ${newData.email}`);

      try {
        // 2. DB 역할(Role) 및 플랜 강제 업데이트
        await snap.ref.update({
          role: "admin",
          plan: "MAKERS", // 관리자는 최고 플랜 권한을 가짐
          isAdmin: true   // 편의상 필드 추가
        });

        // 3. Auth Token Claim도 다시 한 번 확실하게 부여 (혹시 풀렸을 경우 대비)
        await admin.auth().setCustomUserClaims(uid, { admin: true });

        functions.logger.info(`[Admin Auto-Grant] 성공: ${newData.email} -> Admin 권한 부여 완료`);
      } catch (error) {
        functions.logger.error(`[Admin Auto-Grant] 실패: ${newData.email}`, error);
      }
    }
  });

// --- [신규] 새 작업 요청 시 슬랙 알림 전송 (v1 구문) ---
export const sendSlackNotificationOnNewRequest = functions
  .runWith({ timeoutSeconds: 60 }) // [수정] 실행 시간 60초로 연장
  .firestore
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
      // [수정] timeout 옵션 추가 (5초)
      await axios.post(webhookUrl, slackMessage, { timeout: 5000 });
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
export const sendSlackNotificationOnNewFeedback = functions
  .runWith({ timeoutSeconds: 60 }) // [수정] 실행 시간 60초로 연장
  .firestore
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

    // [수정] 담당자 정보 구성
    const assignedName = requestData.assignedResearcher; 
    let assigneeText = "미배정"; // 담당자가 없을 경우 기본 문구

    if (assignedName) {
      // 슬랙 ID가 있으면 멘션 포맷(<@ID>), 없으면 이름만 표시
      const slackId = RESEARCHER_SLACK_IDS[assignedName];
      assigneeText = slackId ? `<@${slackId}>` : assignedName;
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
            },
            // [수정] 담당자 필드 추가
            {
              type: "mrkdwn",
              text: `*담당자:*\n${assigneeText}`
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
      // [수정] timeout 옵션 추가 (5초)
      await axios.post(webhookUrl, slackMessage, { timeout: 5000 });
      functions.logger.info(`[Slack] 피드백 알림 전송 성공: ${requestId}`);
    } catch (error) {
      functions.logger.error(`[Slack] 피드백 알림 전송 실패`, error);
    }
    
    return null;
  });

/**
 * [신규 트리거] 작업 상태 변경 시 알림 생성 (DB에 저장)
 * - 강사가 요청한 작업의 상태가 (접수됨 -> 작업중 -> 완료/반려)로 바뀔 때 알림을 보냅니다.
 */
export const createNotificationOnStatusChange = functions
  .runWith({ timeoutSeconds: 60 }) // [수정] 실행 시간 60초로 연장
  .firestore
  .document("requests/{requestId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const requestId = context.params.requestId;

    // 상태가 바뀌지 않았으면 무시
    if (before.status === after.status) return null;

    const instructorId = after.instructorId; // 알림 받을 강사 ID
    const title = after.title;
    let notiTitle = "";
    let notiMessage = "";
    let notiType = "info";

    // 상태별 메시지 설정
    switch (after.status) {
      case "in_progress":
        notiTitle = "작업 시작";
        notiMessage = `'${title}' 작업이 시작되었습니다. 담당자가 배정되었습니다.`;
        notiType = "info";
        break;
      case "completed":
        notiTitle = "제작 완료";
        notiMessage = `'${title}' 작업이 완료되었습니다! 결과물을 확인해보세요.`;
        notiType = "success";
        break;
      case "rejected":
        notiTitle = "요청 반려";
        notiMessage = `'${title}' 요청이 반려되었습니다. 사유를 확인해주세요.`;
        notiType = "error";
        break;
      default:
        return null;
    }

    // notifications 컬렉션에 알림 추가 (이게 추가되면 프론트엔드 종이 울림)
    try {
      await admin.firestore().collection("notifications").add({
        userId: instructorId, // 받는 사람
        type: notiType,       // success, info, error
        title: notiTitle,
        message: notiMessage,
        link: `/dashboard`,   // 클릭 시 이동할 곳 (대시보드에서 확인하므로)
        isRead: false,        // 안 읽음 상태로 시작
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        requestId: requestId
      });
      functions.logger.info(`[Notification] 알림 생성 성공: ${requestId} -> ${after.status}`);
    } catch (error) {
      functions.logger.error("[Notification] 알림 생성 실패", error);
    }
    return null;
  });

/**
 * [신규 트리거] 새 피드백 메시지 수신 시 알림 생성
 * - 관리자가 댓글을 달면 -> 강사에게 알림
 * - 강사가 댓글을 달면 -> 관리자에게 알림 (관리자는 알림벨 대신 대시보드 카운트로 확인하므로 생략 가능하나, 필요 시 추가)
 */
export const createNotificationOnNewFeedback = functions
  .runWith({ timeoutSeconds: 60 }) // [수정] 실행 시간 60초로 연장
  .firestore
  .document("requests/{requestId}/feedback/{messageId}")
  .onCreate(async (snap, context) => {
    const feedback = snap.data();
    const requestId = context.params.requestId;

    // 관리자가 쓴 글만 강사에게 알림 (강사가 쓴 글은 본인이 쓴 거니 알림 X)
    if (feedback.authorType !== "admin") return null;

    // 해당 요청 문서에서 강사 ID 찾기
    const requestDoc = await admin.firestore().collection("requests").doc(requestId).get();
    const requestData = requestDoc.data();
    
    if (!requestData) return null;

    await admin.firestore().collection("notifications").add({
      userId: requestData.instructorId,
      type: "info",
      title: "새 메시지 도착",
      message: `관리자님이 메시지를 남겼습니다: "${feedback.text.substring(0, 20)}"`,
      link: `/dashboard`, // 클릭 시 모달을 띄워야 하므로 일단 대시보드로
      isRead: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      requestId: requestId
    });
    return null;  // [추가]
  });             // [추가]
    
/**
 * [수정] 사업자 정보 업데이트 감지 -> 슬랙 알림 (전용 채널 지원)
 */
export const notifyAdminOnBusinessInfoUpdate = functions
  .runWith({ timeoutSeconds: 60 })
  .firestore
  .document("users/{uid}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // businessInfo가 없거나, 검수 상태(verificationStatus)가 변하지 않았으면 무시
    const beforeStatus = before.businessInfo?.verificationStatus;
    const afterStatus = after.businessInfo?.verificationStatus;

    // 상태가 'pending'(검수 대기)으로 변경된 경우에만 알림 발송
    if (afterStatus === 'pending' && beforeStatus !== 'pending') {
      
      // [중요] 사업자 인증 전용 웹훅 URL을 우선 사용하고, 없으면 기본 URL 사용
      const webhookUrl = 
        process.env.SLACK_BIZ_WEBHOOK_URL || 
        process.env.SLACK_WEBHOOK_URL || 
        functions.config().slack.webhook_url;

      if (!webhookUrl) {
        functions.logger.warn("[Slack] Webhook URL이 설정되지 않았습니다.");
        return null;
      }

      const slackMessage = {
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "📄 새로운 사업자 등록증 도착",
              emoji: true,
            },
          },
          {
            type: "section",
            fields: [
              {
                type: "mrkdwn",
                text: `*신청자:*\n${after.name} (${after.email})`
              },
              {
                type: "mrkdwn",
                text: `*학원명:*\n${after.academy}`
              },
              {
                type: "mrkdwn",
                text: `*상호명:*\n${after.businessInfo?.companyName || "미입력"}`
              },
              {
                type: "mrkdwn",
                text: `*사업자번호:*\n${after.businessInfo?.registrationNumber || "-"}`
              }
            ]
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "관리자 페이지에서 검수하기",
                  emoji: true
                },
                // [주의] 실제 배포된 URL로 꼭 변경해주세요!
                url: `https://rmcontents1.web.app/admin/billing`, 
                style: "primary"
              }
            ]
          }
        ]
      };

      try {
        await axios.post(webhookUrl, slackMessage, { timeout: 5000 });
        functions.logger.info(`[Slack] 사업자 정보 알림 전송 성공: ${after.email}`);
      } catch (e) {
        functions.logger.error("[Slack] 알림 전송 실패", e);
      }
    }
    
    return null;
  });

  // 사용자의 사업자 인증 상태가 변경되면 알림 발송
export const notifyUserOnVerificationChange = functions
  .region('asia-east1')
  .firestore.document("users/{uid}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    const beforeStatus = before.businessInfo?.verificationStatus;
    const afterStatus = after.businessInfo?.verificationStatus;

    if (beforeStatus !== afterStatus && (afterStatus === 'verified' || afterStatus === 'rejected')) {
      const isRejected = afterStatus === 'rejected';
      
      await admin.firestore().collection("notifications").add({
        userId: context.params.uid,
        type: isRejected ? "error" : "success",
        title: isRejected ? "사업자 정보 반려" : "사업자 정보 승인",
        message: isRejected 
          ? `제출하신 증빙 서류가 반려되었습니다. 사유: ${after.businessInfo?.rejectionReason}`
          : "사업자 정보 검수가 완료되었습니다.",
        link: "/profile/billing",
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

  /**
 * [신규] 정기결제 등록 및 첫 결제 처리
 * 1. authKey로 billingKey 발급
 * 2. billingKey로 즉시 결제 요청
 * 3. 성공 시 DB에 billingKey 저장 및 유저 플랜 업데이트
 */
export const registerSubscription = functions
  .region("asia-east1")
  .https.onRequest(async (req, res) => {
    // 1. CORS 헤더 설정
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { authKey, customerKey, planName, userId } = req.body;

      // 플랜별 가격
      const PLAN_PRICES: Record<string, number> = {
        "Basic Plan": 129000,
        "Student Premium Plan": 19900,
      };
      const amount = PLAN_PRICES[planName] || 0;

      // 시크릿 키 가져오기
      const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
      if (!TOSS_SECRET_KEY) {
        throw new Error("TOSS_SECRET_KEY가 설정되지 않았습니다.");
      }
      const encryptedSecretKey = Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");

      // ---------------------------------------------------------
      // [단계 1] 빌링키 발급 (authKey -> billingKey)
      // ---------------------------------------------------------
      console.log(`[Billing] 1. 빌링키 발급 시도 (authKey: ${authKey})`);
      
      let issueResponse;
      try {
        issueResponse = await axios.post(
          "https://api.tosspayments.com/v1/billing/authorizations/issue",
          { authKey, customerKey },
          {
            headers: {
              Authorization: `Basic ${encryptedSecretKey}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (e: any) {
        console.error("[Billing] 빌링키 발급 실패:", e.response?.data);
        throw new Error(`빌링키 발급 실패: ${e.response?.data?.message || e.message}`);
      }

      const billingKey = issueResponse.data.billingKey;
      console.log(`[Billing] 2. 빌링키 발급 성공: ${billingKey}`);

      if (!billingKey) {
        throw new Error("응답에서 빌링키를 찾을 수 없습니다.");
      }

      // ---------------------------------------------------------
      // [단계 2] 첫 결제 요청 (billingKey 사용)
      // ---------------------------------------------------------
      const orderId = `sub_${userId}_${Date.now()}`;
      
      // ★ 중요: billingKey에 특수문자가 있을 수 있으므로 encodeURIComponent 사용
      const paymentUrl = `https://api.tosspayments.com/v1/billing/${encodeURIComponent(billingKey)}`;
      
      console.log(`[Billing] 3. 결제 요청 시작 (URL: ${paymentUrl})`);

      let paymentResponse;
      try {
        paymentResponse = await axios.post(
          paymentUrl,
          {
            customerKey,
            amount,
            orderId,
            orderName: `${planName} (정기구독)`,
            customerEmail: "",
          },
          {
            headers: {
              Authorization: `Basic ${encryptedSecretKey}`,
              "Content-Type": "application/json",
            },
          }
        );
      } catch (e: any) {
        console.error("[Billing] 결제 승인 실패:", e.response?.data);
        // 여기서 "빌링키가 존재하지 않습니다"가 뜨는지 확인해야 함
        throw new Error(`결제 승인 실패: ${e.response?.data?.message || e.message}`);
      }

      // ---------------------------------------------------------
      // [단계 3] DB 업데이트
      // ---------------------------------------------------------
      if (paymentResponse.status === 200) {
        console.log(`[Billing] 4. 결제 성공! DB 업데이트 진행`);
        
        await admin.firestore().collection("users").doc(userId).update({
          plan: planName.includes("Student") ? "STD_PREMIUM" : "BASIC",
          billingKey: billingKey,
          subscriptionStatus: "ACTIVE",
          nextPaymentDate: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await admin.firestore().collection("payments").add({
          userId,
          orderId,
          amount,
          status: "DONE",
          method: "BILLING",
          approvedAt: paymentResponse.data.approvedAt,
          rawResponse: paymentResponse.data,
        });

        res.status(200).json({ status: "SUCCESS", data: paymentResponse.data });
      }
    } catch (error: any) {
      console.error("[Billing] 최종 에러:", error.message);
      res.status(400).json({
        status: "FAIL",
        message: error.message || "Subscription processing failed",
      });
    }
  });