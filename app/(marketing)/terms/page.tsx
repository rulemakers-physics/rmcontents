// app/(marketing)/terms/page.tsx

import React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function TermsPage() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="container mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>로그인 페이지로 돌아가기</span>
          </Link>
        </div>

        <article className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-p:text-gray-600 prose-li:text-gray-600">
          <h1>서비스 이용약관</h1>
          <p className="text-sm text-gray-500 border-b pb-4">
            시행일: 2026년 1월 19일 (v1.2 - Open Beta)
          </p>

          <h2>제1조 (목적)</h2>
          <p>
            본 약관은 <strong>RuleMakers</strong>(이하 "회사")가 제공하는 문제은행 및 컨텐츠 제작 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>

          <h2>제2조 (용어의 정의)</h2>
          <ul>
            <li><strong>"서비스"</strong>란 구현되는 단말기(PC, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 회원이 이용할 수 있는 RuleMakers의 문제은행, 커스텀 컨텐츠 제작 및 학습 관리 시스템(LMS)을 의미합니다.</li>
            <li><strong>"회원"</strong>이라 함은 회사의 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객(학원, 강사, 학생 등)을 말합니다.</li>
            <li><strong>"컨텐츠"</strong>라 함은 회사가 제작하여 서비스 내에 제공하는 문제, 해설, 이미지, 영상 등 일체의 자료를 의미합니다.</li>
            <li><strong>"이용료"</strong>라 함은 회원이 서비스를 이용하기 위해 회사에 납부하는 비용을 의미합니다.</li>
          </ul>

          <h2>제3조 (약관의 게시와 개정)</h2>
          <p>
            1. 회사는 본 약관의 내용을 회원이 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.<br />
            2. 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 적용일자 7일 전(중대한 변경은 30일 전)부터 공지합니다. 회원이 거부 의사를 표시하지 않으면 동의한 것으로 간주합니다.
          </p>

          <h2>제4조 (이용계약의 성립)</h2>
          <p>
            1. 이용계약은 가입신청자가 약관에 동의하고 가입을 신청한 후, 회사가 이를 승낙함으로써 성립합니다.<br />
            2. 회사는 실명이 아니거나, 타인의 정보를 도용하거나, 과거 서비스 이용 제한 이력이 있는 신청자에 대해 승낙을 거부하거나 유보할 수 있습니다.
          </p>

          <h2>제5조 (개인정보보호 의무)</h2>
          <p>
            회사는 관계 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력하며, 개인정보의 보호 및 사용에 대해서는 관련 법령 및 회사의 개인정보처리방침이 적용됩니다.
          </p>

          <h2>제6조 (회원 정보의 관리 및 계정 공유 금지)</h2>
          <p>
            1. 회원의 아이디와 비밀번호에 관한 관리책임은 회원에게 있으며, 이를 제3자가 이용하도록 하여서는 안 됩니다.<br />
            2. <strong>계정 공유 금지:</strong> 회원은 본인의 계정을 타인(동료 강사, 다른 학원 관계자 등)과 공유하거나 양도, 대여할 수 없습니다. 하나의 계정으로 다수의 인원이 접속하거나 사용하는 정황이 포착될 경우, 회사는 즉시 해당 계정을 정지할 수 있습니다.
          </p>

          <h2>제7조 (서비스의 제공 및 변경)</h2>
          <p>
            1. 회사는 운영상, 기술상의 필요에 따라 제공하고 있는 서비스의 전부 또는 일부를 변경할 수 있습니다. 무료로 제공되는 서비스의 경우 회사의 정책에 따라 수정, 중단될 수 있으며 이에 대해 별도의 보상을 하지 않습니다.<br />
            2. 회사는 정기점검, 시스템 교체, 통신 두절 등 불가피한 사유가 발생한 경우 서비스 제공을 일시적으로 중단할 수 있습니다.
          </p>

          <h2>제8조 (회원의 의무)</h2>
          <p>
            회원은 다음 행위를 하여서는 안 됩니다.
          </p>
          <ul>
            <li>신청 또는 변경 시 허위내용의 등록</li>
            <li>타인의 정보 도용 및 계정 공유</li>
            <li><strong>미계약 사업장에서의 사용:</strong> 회원이 소속된(계약된) 학원 외의 장소나 다른 학원에서 계정을 사용하여 컨텐츠를 출력하거나 영리 활동을 하는 행위</li>
            <li>회사의 컨텐츠를 무단으로 복제, 배포, 판매, 출판하는 행위 (2차 저작물 제작 포함)</li>
            <li>자동화된 프로그램(매크로, 스크립트 등)을 사용하여 서비스를 이용하거나 서버에 부하를 주는 행위</li>
            <li>회사의 운영진, 직원 또는 관계자를 사칭하거나 회사의 명예를 훼손하는 행위</li>
          </ul>

          <h2>제9조 (서비스 이용 제한)</h2>
          <p>
            회사는 회원이 본 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 사전 통지 없이 경고, 일시정지, 영구이용정지(강제 탈퇴) 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.
          </p>

          <h2>제10조 (저작권의 귀속 및 이용제한)</h2>
          <p>
            1. 회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.<br />
            2. 회원은 서비스를 이용함으로써 얻은 정보를 회사의 사전 승낙 없이 영리 목적으로 이용하거나 제3자에게 제공하여서는 안 됩니다.
          </p>

          <h2>제11조 (이용료의 결제)</h2>
          <p>
            1. 회사는 유료 서비스를 제공하며, 회원은 회사가 정한 결제 수단을 통해 이용료를 선불로 납입해야 합니다.<br />
            2. 정기 결제 서비스의 경우, 회원이 해지 의사를 밝히지 않는 한 매월 동일한 날짜에 자동으로 결제가 이루어집니다.
          </p>

          <h2>제12조 (청약철회 등)</h2>
          <p>
            1. 회원은 결제일로부터 7일 이내에 청약철회를 할 수 있습니다. 단, <strong>서비스를 전혀 이용하지 않은 경우</strong>에 한합니다.<br />
            2. <strong>청약철회 제한:</strong> 회원이 단 1개의 파일이라도 다운로드하거나, 문제를 열람하거나, 맞춤형 제작이 이미 착수된 경우에는 디지털 컨텐츠의 특성상 청약철회가 제한될 수 있습니다.
          </p>

          <h2>제13조 (환불 및 취소) [중요]</h2>
          <p>
            회원이 서비스 이용 중도에 해지(환불)를 요청하는 경우, <strong>결제일(이체일)을 기준</strong>으로 다음 규정에 따라 환불 금액을 산정합니다.
          </p>
          <div className="not-prose my-6">
            <table className="min-w-full divide-y divide-gray-300 border border-gray-300 rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">경과 기간</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">환불 가능 금액</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">7일 이내</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">결제금액의 <strong>70%</strong> 환불</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">8일 ~ 14일 이내</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">결제금액의 <strong>40%</strong> 환불</td>
                </tr>
                <tr>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">15일 이후</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-red-600 font-bold">환불 불가</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            1. 환불 시 결제 수수료 및 송금 수수료는 공제될 수 있습니다.<br />
            2. 프로모션으로 제공된 무료 기간이나 추가 혜택은 환불 기간 산정에 포함되지 않습니다.<br />
            3. <strong>Maker's Plan(맞춤 제작)</strong>은 제작 착수 후에는 원칙적으로 환불이 불가능합니다.
          </p>

          <h2>제14조 (면책조항)</h2>
          <p>
            1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.<br />
            2. 회사는 회원의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.<br />
            3. 회사는 회원이 서비스와 관련하여 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.
          </p>

          <h2>제15조 (부정 이용 금지 및 위약벌) [중요]</h2>
          <p>
            1. 회사는 다음 각 호를 부정 이용행위로 간주합니다.
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>동일한 ID를 복수의 인원이 공유하여 사용하는 행위</li>
              <li>자신의 ID를 타인에게 판매, 대여, 양도하는 행위</li>
              <li>회사의 문제 이미지를 대량으로 저장하거나 데이터베이스를 구축하는 행위</li>
              <li>계약되지 않은 다른 학원이나 장소에서 계정을 사용하는 행위</li>
            </ul>
          </p>
          <p className="mt-4">
            2. <strong>제재 및 손해배상:</strong> 부정 이용이 적발될 경우, 회사는 즉시 해당 계정을 정지 및 강제 탈퇴 처리할 수 있습니다. 또한 회원은 회사에 발생한 손해를 배상해야 하며, 이와 별도로 <strong>위약벌(Penalty)</strong>을 지급해야 합니다.
          </p>
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-2 text-sm text-red-800">
            <strong>[위약벌 기준]</strong><br/>
            1. 부정 이용 기간 동안의 <strong>정상 이용료의 3배</strong><br/>
            2. 컨텐츠 무단 유출 시: <strong>문항당 100,000원</strong><br/>
            3. 법적 대응 시 발생하는 변호사 비용 등 제반 비용 전액
          </div>
          <p className="mt-2">
            3. 회원은 위약벌을 지급한다고 하여 본 조항 위반에 대한 면책을 주장할 수 없습니다.
          </p>

          <h2>제16조 (기술적 지원의 한계)</h2>
          <p>
            회사는 서비스 소프트웨어 자체의 기능 장애에 대해서만 기술적 지원을 제공합니다. 회원의 PC, 모바일 기기, 태블릿 등 하드웨어의 불량, 인터넷 네트워크 불안정, 프린터 기기 및 드라이버 오류, 타사 소프트웨어와의 충돌 등으로 인해 발생하는 문제는 회사의 기술 지원 범위에 포함되지 않으며, 이에 대한 책임을 지지 않습니다.
          </p>

          <h2>제17조 (상표 및 홍보 제한)</h2>
          <p>
            회원은 회사의 명시적 서면 동의 없이 자신의 광고(간판, 전단지, 온라인 광고 등)에 RuleMakers의 로고, 상표, 서비스명을 사용하거나 회사와 제휴 관계인 것처럼 표기해서는 안 됩니다. 이를 위반할 경우 상표권 침해에 따른 법적 책임을 질 수 있습니다.
          </p>

          <h2>부칙</h2>
          <p>본 약관은 2026년 1월 19일부터 시행합니다.</p>
        </article>
      </div>
    </div>
  );
}