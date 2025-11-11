// app/showcase/page.tsx

import { CheckCircleIcon } from "@heroicons/react/24/solid"; // heroicons가 필요합니다. (npm install @heroicons/react)

// (설치) npm install @heroicons/react

const samples = [
  {
    title: "학교별 내신 대비 모의고사",
    description: "학교별 최신 기출을 완벽 분석하여 제작된 고품질 내신 저격 모의고사입니다.",
    features: [
      "최신 기출 분석을 바탕으로 한 유형 완벽 반영",
      "고난도 서술형 문항 포함",
      "정확한 해설지 제공",
      "모의고사 유사 문항 추가 제공(요청시)",
    ],
    mockImageUrl: "/mockup-exam.png", // 예시 이미지 경로 (public 폴더에 넣어주세요)
  },
  {
    title: "내신 대비 N제",
    description: "특정 주제나 유형을 집중 공략할 수 있도록 설계된 문항 N제입니다.",
    features: [
      "킬러 문항 대비 집중 훈련",
      "학교의 출제 코드에 맞춘 문항 설계",
      "다양한 난이도 배분",
      "자료 및 유형 다각화로 내신 완벽 대비"
    ],
    mockImageUrl: "/mockup-nje.png", // 예시 이미지 경로
  },
];

export default function ShowcasePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <main className="flex-grow container mx-auto max-w-5xl px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            컨텐츠 샘플
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            RuleMakers에서 제공하는 맞춤형 컨텐츠 퀄리티를 확인해보세요.
          </p>
        </div>

        <div className="space-y-20">
          {samples.map((sample) => (
            <div
              key={sample.title}
              className="flex flex-col md:flex-row items-center gap-12 rounded-lg bg-white p-8 shadow-lg"
            >
              {/* 콘텐츠 샘플 설명 */}
              <div className="w-full md:w-1/2">
                <h2 className="text-3xl font-bold text-gray-900">
                  {sample.title}
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  {sample.description}
                </p>
                <ul className="mt-8 space-y-3">
                  {sample.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-blue-600" />
                      <span className="ml-3 text-base font-medium text-gray-700">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* 이미지 목업 (임시) */}
              <div className="w-full md:w-1/2">
                <div className="aspect-w-4 aspect-h-3 w-full overflow-hidden rounded-lg bg-gray-200">
                  {/* public 폴더에 mock-exam.png 같은 예시 이미지를 넣어주세요. */}
                  {/* <Image src={sample.mockImageUrl} alt={sample.title} layout="fill" objectFit="cover" /> */}
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    (샘플 이미지: 4:3 비율)
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}