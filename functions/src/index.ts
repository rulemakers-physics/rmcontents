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
 * [신규] 정기결제 등록 및 첫 결제 처리 (무료 체험 로직 포함)
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
      // isTrialExtension 파라미터 추가
      const { authKey, customerKey, planName, userId, isTrialExtension } = req.body;

      console.log(`[Billing] 요청 시작 - User: ${userId}, Plan: ${planName}, TrialExtension: ${isTrialExtension}`);

      // 플랜별 가격
      const PLAN_PRICES: Record<string, number> = {
        "Basic Plan": 198000, 
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
        // 에러 상세 로깅
        console.error("[Billing] 빌링키 발급 API 에러 응답:", JSON.stringify(e.response?.data));
        console.error("[Billing] 사용된 Secret Key (앞 5자리):", TOSS_SECRET_KEY.substring(0, 5) + "***");
        
        throw new Error(`빌링키 발급 실패: ${e.response?.data?.message || e.message}`);
      }

      const billingKey = issueResponse.data.billingKey;
      console.log(`[Billing] 2. 빌링키 발급 성공: ${billingKey}`);

      if (!billingKey) {
        throw new Error("응답에서 빌링키를 찾을 수 없습니다.");
      }

      // ---------------------------------------------------------
      // [단계 2] 분기 처리: 무료 체험 연장 vs 즉시 결제
      // ---------------------------------------------------------
      
      // [Case A] 무료 체험 연장인 경우 (결제 스킵)
      if (isTrialExtension) {
        console.log(`[Billing] 무료 체험 연장 모드: 즉시 결제를 건너뜁니다.`);
        
        // 14일 뒤로 다음 결제일 설정
        const nextPaymentDate = new Date();
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);

        await admin.firestore().collection("users").doc(userId).update({
          billingKey: billingKey,
          subscriptionStatus: "ACTIVE", // 혹은 TRIAL 유지
          plan: planName === "Student Premium Plan" ? "STD_PREMIUM" : "BASIC",
          nextPaymentDate: admin.firestore.Timestamp.fromDate(nextPaymentDate),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(200).json({ status: "SUCCESS", message: "Free trial extended", billingKey });
        return;
      }

      // [Case B] 즉시 결제 (기존 로직)
      const orderId = `sub_${userId}_${Date.now()}`;
      console.log(`[Billing] 3. 결제 요청 시작 (URL: .../billing/${billingKey})`);

      let paymentResponse;
      try {
        paymentResponse = await axios.post(
          `https://api.tosspayments.com/v1/billing/${encodeURIComponent(billingKey)}`,
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
        throw new Error(`결제 승인 실패: ${e.response?.data?.message || e.message}`);
      }

      if (paymentResponse.status === 200) {
        console.log(`[Billing] 4. 결제 성공! DB 업데이트 진행`);
        
        // 결제 성공 시: 다음 결제일은 30일 뒤
        const nextPaymentDate = new Date();
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

        await admin.firestore().collection("users").doc(userId).update({
          plan: planName.includes("Student") ? "STD_PREMIUM" : "BASIC",
          billingKey: billingKey,
          subscriptionStatus: "ACTIVE",
          nextPaymentDate: admin.firestore.Timestamp.fromDate(nextPaymentDate),
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

  /**
 * [수정됨] 정기 결제 스케줄러 (해지 예약 처리 로직 추가)
 */
export const processRecurringPayments = functions
  .runWith({ timeoutSeconds: 540 })
  .region("asia-east1")
  .pubsub.schedule("0 9 * * *") // 매일 오전 9시 실행
  .timeZone("Asia/Seoul")
  .onRun(async (context) => {
    const today = new Date();
    
    // 1. 결제일이 도래한 유저 조회 (빌링키 보유자)
    const usersSnap = await admin.firestore().collection("users")
      .where("nextPaymentDate", "<=", today)
      .where("billingKey", "!=", null)
      .get();

    if (usersSnap.empty) {
      console.log("오늘 처리할 결제/해지 대상이 없습니다.");
      return null;
    }

    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
    const encryptedSecretKey = Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");

    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data();
      const { billingKey, plan, uid, subscriptionStatus } = userData;

      // [핵심 로직 1] 해지 예약자인 경우 -> 결제 스킵 & 구독 종료 처리
      if (subscriptionStatus === 'SCHEDULED_CANCEL') {
        console.log(`[Cancel] ${uid}님의 구독이 예약 해지되었습니다.`);
        await userDoc.ref.update({
          subscriptionStatus: "CANCELED", // 상태 변경
          billingKey: null,               // 빌링키 삭제 (더 이상 결제 불가)
          plan: "FREE",                   // 플랜 다운그레이드
          canceledAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        continue; // 다음 유저로 넘어감 (결제 로직 실행 X)
      }

      // [핵심 로직 2] 결제 진행 (ACTIVE 또는 TRIAL 상태인 경우)
      // 가격 결정
      const amount = plan === 'BASIC' ? 198000 : 19900; 
      const orderId = `sub_${uid}_${Date.now()}`;

      try {
        const response = await axios.post(
          `https://api.tosspayments.com/v1/billing/${encodeURIComponent(billingKey)}`,
          {
            customerKey: uid,
            amount: amount,
            orderId: orderId,
            orderName: `${plan} 정기결제`,
          },
          { headers: { Authorization: `Basic ${encryptedSecretKey}`, "Content-Type": "application/json" } }
        );

        if (response.status === 200) {
          // 결제 성공: 다음 결제일 +30일 & 상태 ACTIVE 유지
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + 30);

          await userDoc.ref.update({
            subscriptionStatus: "ACTIVE", // TRIAL이었어도 이제 ACTIVE가 됨
            nextPaymentDate: admin.firestore.Timestamp.fromDate(nextDate),
            lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
          });

          await admin.firestore().collection("payments").add({
            userId: uid,
            orderId,
            amount,
            status: "DONE",
            method: "RECURRING",
            approvedAt: response.data.approvedAt,
            rawResponse: response.data,
          });
          console.log(`[Success] ${uid} 정기 결제 성공`);
        }
      } catch (error: any) {
        console.error(`[Fail] ${uid} 결제 실패:`, error.response?.data?.message);
        
        // 결제 실패 처리
        await userDoc.ref.update({
          subscriptionStatus: "PAYMENT_FAILED",
          lastPaymentFailReason: error.response?.data?.message || "알 수 없는 오류",
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }
    return null;
  });

 /**
 * [수정됨] 카드 변경 (빌링키 업데이트) 및 미납 재결제 시도
 */
export const updateCard = functions
  .region("asia-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "로그인 필요");

    const { authKey, customerKey } = data;
    const userId = context.auth.uid;

    const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY;
    const encryptedSecretKey = Buffer.from(TOSS_SECRET_KEY + ":").toString("base64");

    try {
      // 1. 새 빌링키 발급
      const response = await axios.post(
        "https://api.tosspayments.com/v1/billing/authorizations/issue",
        { authKey, customerKey },
        { headers: { Authorization: `Basic ${encryptedSecretKey}` } }
      );

      const newBillingKey = response.data.billingKey;
      
      // 사용자 정보 조회
      const userDoc = await admin.firestore().collection("users").doc(userId).get();
      const userData = userDoc.data();
      
      // 2. DB 업데이트 (빌링키)
      await userDoc.ref.update({
        billingKey: newBillingKey,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. [보완 로직] 결제 실패 상태였다면 즉시 재결제 시도
      if (userData && userData.subscriptionStatus === 'PAYMENT_FAILED') {
         console.log(`[Retry] ${userId}님 카드 변경됨. 미납 요금 재결제 시도.`);
         
         const amount = userData.plan === 'BASIC' ? 198000 : 19900;
         const orderId = `retry_${userId}_${Date.now()}`;
         
         try {
            const payRes = await axios.post(
              `https://api.tosspayments.com/v1/billing/${encodeURIComponent(newBillingKey)}`,
              {
                customerKey: userId,
                amount: amount,
                orderId: orderId,
                orderName: `${userData.plan} 미납 재결제`,
              },
              { headers: { Authorization: `Basic ${encryptedSecretKey}`, "Content-Type": "application/json" } }
            );
            
            if (payRes.status === 200) {
               // 재결제 성공 시 ACTIVE로 복구 및 날짜 갱신
               const nextDate = new Date();
               nextDate.setDate(nextDate.getDate() + 30);
               
               await userDoc.ref.update({
                 subscriptionStatus: "ACTIVE",
                 nextPaymentDate: admin.firestore.Timestamp.fromDate(nextDate),
                 lastPaymentFailReason: admin.firestore.FieldValue.delete() // 에러 메시지 삭제
               });
               
               // 결제 이력 저장
               await admin.firestore().collection("payments").add({
                  userId, orderId, amount, status: "DONE", method: "RETRY",
                  approvedAt: payRes.data.approvedAt, rawResponse: payRes.data
               });
               
               return { status: "SUCCESS", message: "카드 변경 및 재결제 성공" };
            }
         } catch (payErr) {
            console.error("재결제 실패:", payErr);
            // 재결제 실패해도 카드 변경 자체는 성공했음을 반환 (단, 상태는 여전히 FAILED)
            return { status: "PARTIAL_SUCCESS", message: "카드 변경 성공, 재결제 실패" };
         }
      }

      return { status: "SUCCESS" };
    } catch (error: any) {
      console.error("[Card Update Fail]", error.response?.data || error);
      throw new functions.https.HttpsError("internal", "카드 변경 실패");
    }
  });

/**
 * [신규] 구독 해지 예약
 * - 즉시 해지가 아니라, 다음 결제일에 결제가 되지 않도록 상태를 변경합니다.
 */
export const cancelSubscription = functions
  .region("asia-east1")
  .https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "로그인 필요");
    const userId = context.auth.uid;

    try {
      await admin.firestore().collection("users").doc(userId).update({
        subscriptionStatus: "SCHEDULED_CANCEL", // "해지 예약" 상태
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return { status: "SUCCESS" };
    } catch (error) {
      throw new functions.https.HttpsError("internal", "해지 처리 실패");
    }
  });

  /**
 * [신규] 원장(Director) 정보 변경 시 소속 강사(Instructor) 데이터 동기화
 * - 원장의 Plan, SubscriptionStatus, Academy 이름이 변경되면 강사들에게도 전파합니다.
 */
export const syncDirectorUpdatesToInstructors = functions
  .runWith({ timeoutSeconds: 60 })
  .region("asia-east1")
  .firestore
  .document("users/{directorId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    const directorId = context.params.directorId;

    // 1. Director가 아니면 무시
    if (newData.role !== "director") return null;

    // 2. 변경 사항 체크 (플랜, 구독상태, 학원명, 만료일 등)
    const planChanged = newData.plan !== oldData.plan;
    const statusChanged = newData.subscriptionStatus !== oldData.subscriptionStatus;
    const academyChanged = newData.academy !== oldData.academy;
    
    // Timestamp 비교 (Optional Chaining 및 isEqual 사용)
    const dateChanged = 
      (newData.nextPaymentDate && !oldData.nextPaymentDate) ||
      (!newData.nextPaymentDate && oldData.nextPaymentDate) ||
      (newData.nextPaymentDate && oldData.nextPaymentDate && !newData.nextPaymentDate.isEqual(oldData.nextPaymentDate));

    // 변경사항이 없으면 종료
    if (!planChanged && !statusChanged && !academyChanged && !dateChanged) {
      return null;
    }

    functions.logger.info(`[Sync] 원장(${directorId}) 데이터 변경 감지 -> 강사 동기화 시작`);

    try {
      // 3. 해당 원장을 ownerId로 가진 모든 강사 조회
      const instructorsSnap = await admin.firestore().collection("users")
        .where("ownerId", "==", directorId)
        .where("role", "==", "instructor")
        .get();

      if (instructorsSnap.empty) return null;

      // 4. 일괄 업데이트 (Batch)
      const batch = admin.firestore().batch();
      
      instructorsSnap.docs.forEach((doc) => {
        // 원장의 데이터를 그대로 강사에게 덮어씌움 (권한 종속)
        batch.update(doc.ref, {
          plan: newData.plan,
          subscriptionStatus: newData.subscriptionStatus || "NONE",
          academy: newData.academy,
          nextPaymentDate: newData.nextPaymentDate || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });

      await batch.commit();
      functions.logger.info(`[Sync] 강사 ${instructorsSnap.size}명 업데이트 완료`);

    } catch (error) {
      functions.logger.error(`[Sync] 동기화 실패`, error);
    }
    return null;
  });