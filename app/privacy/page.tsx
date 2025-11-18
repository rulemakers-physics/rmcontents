// app/privacy/page.tsx

import React from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

export default function PrivacyPage() {
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
          <h1>개인정보처리방침</h1>
          <p className="text-sm text-gray-500 border-b pb-4">
            시행일: 2025년 10월 1일
          </p>

          <p>
            <strong>RuleMakers</strong>(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 관련 법령에 의거한 개인정보처리방침을 정하여 이용자 권익 보호에 최선을 다하고 있습니다.
          </p>

          <h2>1. 수집하는 개인정보의 항목 및 수집 방법</h2>
          <p>회사는 회원가입, 고객상담, 서비스 신청 등을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
          <ul>
            <li><strong>필수 수집 항목:</strong> 성명, 이메일 주소 (Google 계정 연동 시 자동 수집), 소속 학원/학교명</li>
            <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, 접속 IP 정보, 쿠키</li>
            <li><strong>수집 방법:</strong> 홈페이지 회원가입(소셜 로그인), 프로필 설정 페이지, 서비스 이용 과정에서 생성</li>
          </ul>

          <h2>2. 개인정보의 수집 및 이용 목적</h2>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
          <ul>
            <li><strong>서비스 제공:</strong> 맞춤형 컨텐츠 제작 및 납품, 결과물 발송, 요금 정산</li>
            <li><strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 고지사항 전달</li>
            <li><strong>마케팅 및 광고에 활용:</strong> 신규 서비스(제품) 개발 및 특화, 접속 빈도 파악, 회원의 서비스 이용에 대한 통계</li>
          </ul>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
          </p>
          <ul>
            <li>계약 또는 청약철회 등에 관한 기록: 5년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
            <li>대금결제 및 재화 등의 공급에 관한 기록: 5년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
            <li>소비자의 불만 또는 분쟁처리에 관한 기록: 3년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
          </ul>

          <h2>4. 개인정보의 파기절차 및 방법</h2>
          <p>
            회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 파기절차 및 방법은 다음과 같습니다.
          </p>
          <ul>
            <li><strong>파기절차:</strong> 회원님이 회원가입 등을 위해 입력하신 정보는 목적이 달성된 후 별도의 DB로 옮겨져(종이의 경우 별도의 서류함) 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기되어집니다.</li>
            <li><strong>파기방법:</strong> 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제합니다.</li>
          </ul>

          <h2>5. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
          <p>
            이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수 있습니다.
          </p>

          <h2>6. 개인정보 보호책임자</h2>
          <p>
            회사는 고객의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <ul>
            <li>이메일: support@rulemakers.co.kr</li>
            <li>근무시간: 평일 10:00 ~ 18:00</li>
          </ul>
        </article>
      </div>
    </div>
  );
}