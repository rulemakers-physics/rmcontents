// scripts/upload_bulk.js

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// --------------------------------------------------------
// [설정] 경로 및 버킷 (반드시 본인 환경에 맞게 수정!)
const serviceAccount = require("./serviceAccountKey.json");
const DATA_FILE_PATH = path.join(__dirname, "../data/problem_data.json");
const ANSWER_FILE_PATH = path.join(__dirname, "../data/answers.json");
const IMAGE_FOLDER_PATH = path.join(__dirname, "../data/images");
const BUCKET_NAME = "rmcontents1.firebasestorage.app"; 
// --------------------------------------------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: BUCKET_NAME
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ✅ 난이도 매핑 함수 (0~3.0+ -> 텍스트)
function mapDifficulty(rawScore) {
  const score = parseFloat(rawScore);
  // 값이 없거나 NaN이면 기본값 '중' 처리
  if (isNaN(score)) return '중';

  if (score === 0) return '기본';
  if (score === 1.0) return '하';
  if (score === 1.5) return '중';
  if (score === 2.0 || score === 2.5) return '상';
  if (score >= 3.0) return '킬러';
  
  return '중';
}

async function uploadFileToStorage(filename) {
  const localFilePath = path.join(IMAGE_FOLDER_PATH, filename);
  if (!fs.existsSync(localFilePath)) return null;

  const destination = `problems/${filename}`;
  try {
    const file = bucket.file(destination);
    const [exists] = await file.exists();
    if (exists) return file.publicUrl();

    await bucket.upload(localFilePath, {
      destination,
      public: true,
      metadata: { contentType: 'image/png' },
    });
    return file.publicUrl();
  } catch (error) {
    console.error(`❌ 업로드 실패 (${filename}):`, error.message);
    return null;
  }
}

async function main() {
  console.log("🚀 대량 업로드 시작...");

  const rawData = JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf8"));
  
  // 정답 파일이 있으면 로드, 없으면 빈 배열 처리
  let answerMap = new Map();
  if (fs.existsSync(ANSWER_FILE_PATH)) {
    const answerData = JSON.parse(fs.readFileSync(ANSWER_FILE_PATH, "utf8"));
    answerData.forEach(item => answerMap.set(item.filename, item.answer));
  }

  const indexToFilename = rawData.map(item => item.filename);
  const batchSize = 400; 
  let batch = db.batch();
  let count = 0;
  let totalUploaded = 0;

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    const qFileName = item.filename;
    const sFileName = item.filename.replace(".png", "_s.png"); 

    const answerValue = answerMap.get(qFileName) || null;
    const qUrl = await uploadFileToStorage(qFileName);
    const sUrl = await uploadFileToStorage(sFileName);

    if (!qUrl) {
      console.log(`⚠️ 이미지 파일 없음 (스킵): ${qFileName}`);
      continue;
    }

    const resolvedSimilarProblems = (item.similar_problems || []).map(sim => ({
      targetFilename: indexToFilename[sim.index],
      score: sim.score
    })).filter(sim => sim.targetFilename);

    const docId = qFileName.replace(/\./g, '_'); 
    const docRef = db.collection("problems").doc(docId);

    // ✅ JSON 키 매핑 (실제 JSON 파일의 키값과 일치해야 함!)
    // 예: item["중주제"], item["소주제"], item["RM 난이도"] 등
    const difficultyScore = item["RM 난이도"] || 0;
    const difficultyLabel = mapDifficulty(difficultyScore);

    batch.set(docRef, {
      id: docId,
      filename: qFileName,
      content: item.q_text || "",
      
      // 검색용 계층 구조
      unit: "통합과학 1", 
      majorTopic: item["중주제"]?.[0] || "기타", 
      minorTopic: item["소주제"]?.[0] || "기타",
      
      // 난이도
      difficultyScore: difficultyScore,
      difficulty: difficultyLabel,

      source: "BULK_UPLOAD",
      imgUrl: qUrl,
      solutionUrl: sUrl,
      answer: answerValue, 
      similarProblems: resolvedSimilarProblems,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    count++;
    totalUploaded++;

    if (i % 10 === 0) process.stdout.write(`\r🔄 진행 중: ${i + 1}/${rawData.length}`);

    if (count >= batchSize) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }

  if (count > 0) await batch.commit();

  console.log(`\n🎉 업로드 완료! 총 ${totalUploaded}개 문항 처리됨.`);
}

main().catch(console.error);