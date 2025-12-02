// scripts/upload_bulk.js

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

// --------------------------------------------------------
// [설정] 경로 및 버킷
const serviceAccount = require("./serviceAccountKey.json");
const DATA_FILE_PATH = path.join(__dirname, "../data/problem_data.json");
const ANSWER_FILE_PATH = path.join(__dirname, "../data/answers.json");
const IMAGE_FOLDER_PATH = path.join(__dirname, "../data/images");
const BUCKET_NAME = "rmcontents1.firebasestorage.app";

// [튜닝] 병렬 처리 개수 (너무 높으면 메모리/네트워크 에러 발생 가능)
const CONCURRENCY_LIMIT = 20; 
// --------------------------------------------------------

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: BUCKET_NAME
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// --------------------------------------------------------
// 단원 계층 구조 정의
// --------------------------------------------------------
const SCIENCE_UNITS = [
  {
    name: "통합과학 1",
    majorTopics: [
      { name: "과학의 기초", minorTopics: ["시간과 공간", "기본량과 단위", "측정과 측정 표준", "정보와 디지털 기술"] },
      { name: "원소의 형성", minorTopics: ["우주 초기에 형성된 원소", "지구와 생명체를 이루는 원소의 생성"] },
      { name: "물질의 규칙성과 성질", minorTopics: ["원소의 주기성과 화학 결합", "이온 결합과 공유 결합", "지각과 생명체 구성 물질의 규칙성", "물질의 전기적 성질"] },
      { name: "지구시스템", minorTopics: ["지구시스템의 구성 요소", "지구시스템의 상호작용", "지권의 변화"] },
      { name: "역학 시스템", minorTopics: ["중력과 역학시스템", "운동과 충돌"] },
      { name: "생명 시스템", minorTopics: ["생명 시스템의 기본 단위", "물질대사와 효소", "세포 내 정보의 흐름"] }
    ]
  },
  {
    name: "통합과학 2",
    majorTopics: [
      { name: "지질 시대와 생물 다양성", minorTopics: ["지질시대의 생물과 화석", "자연선택과 진화", "생물다양성과 보전"] },
      { name: "화학 변화", minorTopics: ["산화와 환원", "산성과 염기성", "중화 반응", "물질 변화에서 에너지 출입"] },
      { name: "생태계와 환경 변화", minorTopics: ["생태계 구성 요소", "생태계 평형", "기후 변화와 지구 환경 변화"] },
      { name: "에너지와 지속가능한 발전", minorTopics: ["태양 에너지의 생성과 전환", "전기 에너지의 생산", "에너지 효율과 신재생 에너지"] },
      { name: "과학과 미래 사회", minorTopics: ["과학의 유용성과 필요성", "과학 기술 사회와 빅데이터", "과학 기술의 발전과 미래 사회", "과학 관련 사회적 쟁점과 과학 윤리"] }
    ]
  }
];

function findCategoryInfo(minorTopicName) {
  if (!minorTopicName) return null;
  
  for (const subject of SCIENCE_UNITS) {
    for (const major of subject.majorTopics) {
      if (major.minorTopics.includes(minorTopicName)) {
        return {
          unit: subject.name,
          majorTopic: major.name,
          minorTopic: minorTopicName
        };
      }
    }
  }
  return { unit: "기타", majorTopic: "기타", minorTopic: minorTopicName };
}

function mapDifficulty(rawScore) {
  const score = parseFloat(rawScore);
  if (isNaN(score)) return '중';

  if (score === 0) return '기본';
  if (score === 1.0) return '하';
  if (score === 1.5) return '중';
  if (score === 2.0 || score === 2.5) return '상';
  if (score >= 3.0) return '킬러';
  
  return '중';
}

// [최적화] 파일 업로드 함수
async function uploadFileToStorage(filename) {
  const localFilePath = path.join(IMAGE_FOLDER_PATH, filename);
  if (!fs.existsSync(localFilePath)) return null;

  const destination = `problems/${filename}`;
  const file = bucket.file(destination);

  try {
    // [참고] exists 체크는 네트워크 비용이 발생하므로, 
    // 확실히 덮어쓰기를 원한다면 이 체크를 제거하면 더 빨라집니다.
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

async function processItem(item, indexToFilename, answerMap) {
  const qFileName = item.filename;
  const sFileName = item.filename.replace(".png", "_s.png"); 

  // [병렬 처리] 문항 이미지와 해설 이미지를 동시에 업로드
  const [qUrl, sUrl] = await Promise.all([
    uploadFileToStorage(qFileName),
    uploadFileToStorage(sFileName)
  ]);

  if (!qUrl) {
    console.log(`⚠️ 이미지 파일 없음 (스킵): ${qFileName}`);
    return null;
  }

  const resolvedSimilarProblems = (item.similar_problems || []).map(sim => ({
    targetFilename: indexToFilename[sim.index],
    score: sim.score
  })).filter(sim => sim.targetFilename);

  const docId = qFileName.replace(/\./g, '_'); 
  const jsonTopic = item["중주제"]?.[0];
  const categoryInfo = findCategoryInfo(jsonTopic);
  const difficultyScore = item["RM 난이도"] || 0;
  const difficultyLabel = mapDifficulty(difficultyScore);
  const answerValue = answerMap.get(qFileName) || null;

  // [수정] content 필드 제거됨
  return {
    docId: docId,
    data: {
      id: docId,
      filename: qFileName,
      // content: item.q_text || "",  <-- 제거됨
      
      unit: categoryInfo.unit,
      majorTopic: categoryInfo.majorTopic,
      minorTopic: categoryInfo.minorTopic,
      
      difficultyScore: difficultyScore,
      difficulty: difficultyLabel,

      source: "BULK_UPLOAD",
      imgUrl: qUrl,
      solutionUrl: sUrl,
      answer: answerValue, 
      similarProblems: resolvedSimilarProblems,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    }
  };
}

async function main() {
  console.log("🚀 대량 업로드 시작 (병렬 처리 모드)...");

  const rawData = JSON.parse(fs.readFileSync(DATA_FILE_PATH, "utf8"));
  
  let answerMap = new Map();
  if (fs.existsSync(ANSWER_FILE_PATH)) {
    const answerData = JSON.parse(fs.readFileSync(ANSWER_FILE_PATH, "utf8"));
    answerData.forEach(item => answerMap.set(item.filename, item.answer));
  }

  const indexToFilename = rawData.map(item => item.filename);
  
  let batch = db.batch();
  let batchCount = 0;
  let totalUploaded = 0;

  // [핵심] 데이터를 Chunk 단위로 잘라서 병렬 처리
  for (let i = 0; i < rawData.length; i += CONCURRENCY_LIMIT) {
    const chunk = rawData.slice(i, i + CONCURRENCY_LIMIT);
    
    // 1. 현재 Chunk 내의 아이템들을 동시에 스토리지 업로드 및 데이터 준비
    const promises = chunk.map(item => processItem(item, indexToFilename, answerMap));
    const results = await Promise.all(promises);

    // 2. 준비된 데이터를 Firestore Batch에 추가
    for (const result of results) {
      if (result) {
        const docRef = db.collection("problems").doc(result.docId);
        batch.set(docRef, result.data);
        batchCount++;
        totalUploaded++;
      }
    }

    // 3. 배치 사이즈(400) 도달 시 커밋
    if (batchCount >= 400) {
      await batch.commit();
      batch = db.batch();
      batchCount = 0;
      process.stdout.write(`\r💾 Firestore 저장 중... 현재까지 ${totalUploaded}개 처리`);
    } else {
      process.stdout.write(`\r🔄 업로드 진행 중: ${Math.min(i + CONCURRENCY_LIMIT, rawData.length)}/${rawData.length}`);
    }
  }

  // 남은 배치 커밋
  if (batchCount > 0) {
    await batch.commit();
  }

  console.log(`\n🎉 모든 작업 완료! 총 ${totalUploaded}개 문항 처리됨.`);
}

main().catch(console.error);