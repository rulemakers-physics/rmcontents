// app/terms/page.tsx

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
          <h1>이용약관</h1>
          <p className="text-sm text-gray-500 border-b pb-4">
            시행일: 2025년 10월 1일
          </p>

          <h2>제1조 (목적)</h2>
          <p>
            본 약관은 <strong>RuleMakers</strong>(이하 "회사")가 제공하는 컨텐츠 제작 의뢰 및 관련 제반 서비스(이하 "서비스")의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </p>

          <h2>제2조 (용어의 정의)</h2>
          <ul>
            <li><strong>"서비스"</strong>란 구현되는 단말기(PC, TV, 휴대형단말기 등의 각종 유무선 장치를 포함)와 상관없이 회원이 이용할 수 있는 RuleMakers 및 관련 제반 서비스를 의미합니다.</li>
            <li><strong>"회원"</strong>이라 함은 회사의 서비스에 접속하여 본 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 고객을 말합니다.</li>
            <li><strong>"컨텐츠"</strong>라 함은 회원이 주문하여 회사가 제작, 공급하는 문제, 해설, 이미지 등 일체의 저작물을 의미합니다.</li>
          </ul>

          <h2>제3조 (회원가입 및 계정)</h2>
          <p>
            1. 회원은 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다.<br />
            2. 회사는 Google 소셜 로그인을 통해 간편 가입을 지원하며, 원활한 서비스 제공을 위해 회원의 이름, 이메일, 소속(학원/학교) 등의 정보를 수집할 수 있습니다.
          </p>

          <h2>제4조 (저작권의 귀속 및 이용제한)</h2>
          <p>
            1. 회사가 제작하여 제공하는 모든 컨텐츠의 저작권은 원칙적으로 <strong>회사(RuleMakers)</strong>에 귀속됩니다.<br />
            2. 회원은 제공받은 컨텐츠를 본인의 수업, 강의, 학생 지도 목적으로만 사용할 수 있습니다.<br />
            3. 회원은 회사의 사전 승낙 없이 컨텐츠를 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리 목적으로 이용하거나 제3자에게 제공, 판매하여서는 안 됩니다.<br />
            4. 위반 시 회원은 민·형사상 책임을 질 수 있으며, 이에 대해 회사는 손해배상을 청구할 수 있습니다.
          </p>

          <h2>제5조 (계약의 성립 및 환불)</h2>
          <p>
            1. 맞춤형 컨텐츠 제작 서비스의 특성상, 제작이 착수된 이후(상태가 '작업 중'으로 변경된 후)에는 단순 변심에 의한 취소 및 전액 환불이 불가능합니다.<br />
            2. 결과물에 명백한 오류가 있는 경우, 회원은 수정을 요청할 수 있으며 회사는 이를 성실히 수정하여 재공급합니다.
          </p>

          <h2>제6조 (서비스의 중단)</h2>
          <p>
            회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.
          </p>

          <h2>제7조 (책임의 한계)</h2>
          <p>
            회사는 회원이 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
          </p>

          <h2>부칙</h2>
          <p>본 약관은 2024년 5월 20일부터 적용됩니다.</p>
        </article>
      </div>
    </div>
  );
}