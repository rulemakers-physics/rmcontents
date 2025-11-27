// src/data/mockData.ts

export type Difficulty = '기본' | '하' | '중' | '상' | '킬러';
export type QuestionType = '객관식' | '서답형';

export interface Subject {
  name: string;
  majorTopics: {
    name: string;
    minorTopics: string[];
  }[];
}

export const SCIENCE_UNITS: Subject[] = [
  {
    name: "통합과학 1",
    majorTopics: [
      { name: "1. 과학의 기초", minorTopics: ["시간과 공간", "기본량과 단위", "측정과 측정 표준", "정보와 디지털 기술"] },
      { name: "2. 원소의 형성", minorTopics: ["우주 초기에 형성된 원소", "지구와 생명체를 이루는 원소의 생성"] },
      { name: "3. 물질의 규칙성과 성질", minorTopics: ["원소의 주기성과 화학 결합", "이온 결합과 공유 결합", "지각과 생명체 구성 물질의 규칙성", "물질의 전기적 성질"] },
      { name: "4. 지구시스템", minorTopics: ["지구시스템의 구성 요소", "지구시스템의 상호작용", "지권의 변화"] },
      { name: "5. 역학 시스템", minorTopics: ["중력과 역학시스템", "운동과 충돌"] },
      { name: "6. 생명 시스템", minorTopics: ["생명 시스템의 기본 단위", "물질대사와 효소", "세포 내 정보의 흐름"] }
    ]
  },
  {
    name: "통합과학 2",
    majorTopics: [
      { name: "1. 지질 시대와 생물 다양성", minorTopics: ["지질시대의 생물과 화석", "자연선택과 진화", "생물다양성과 보전"] },
      { name: "2. 화학 변화", minorTopics: ["산화와 환원", "산성과 염기성", "중화 반응", "물질 변화에서 에너지 출입"] },
      { name: "3. 생태계와 환경 변화", minorTopics: ["생태계 구성 요소", "생태계 평형", "기후 변화와 지구 환경 변화"] },
      { name: "4. 에너지와 지속가능한 발전", minorTopics: ["태양 에너지의 생성과 전환", "전기 에너지의 생산", "에너지 효율과 신재생 에너지"] },
      { name: "5. 과학과 미래 사회", minorTopics: ["과학의 유용성과 필요성", "과학 기술 사회와 빅데이터", "과학 기술의 발전과 미래 사회", "과학 관련 사회적 쟁점과 과학 윤리"] }
    ]
  }
];

// 테스트용 문제 더미 데이터
export const MOCK_PROBLEMS = Array.from({ length: 100 }).map((_, i) => ({
  id: `q-${i}`,
  unit: "역학 시스템",
  difficulty: i % 10 === 0 ? '킬러' : i % 3 === 0 ? '상' : '중',
  type: i % 4 === 0 ? '서답형' : '객관식',
  content: `${i + 1}번 문제: 다음 그림과 같이 물체 A가 운동하고 있다... (더미)`,
  imgUrl: "/images/sample_q.png", // 임시 이미지 경로 필요
  answer: (i % 5) + 1,
}));