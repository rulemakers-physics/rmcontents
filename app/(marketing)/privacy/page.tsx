// app/(marketing)/privacy/page.tsx

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

        <article className="prose prose-lg max-w-none text-black 
          prose-headings:font-bold prose-headings:text-black 
          prose-h1:text-3xl 
          prose-h2:text-xl prose-h2:mt-8 
          prose-body:text-black 
          prose-p:text-black 
          prose-li:text-black 
          prose-strong:text-black 
          prose-td:text-black 
          prose-th:text-black">
          <h1>개인정보처리방침</h1>
          <p className="text-sm text-gray-500 border-b pb-4">
            시행일: 2026년 1월 19일 (v1.0)
          </p>

          <p>
            <strong>RuleMakers</strong>(이하 "회사")는 정보통신망 이용촉진 및 정보보호 등에 관한 법률, 개인정보보호법 등 관련 법령상의 개인정보보호 규정을 준수하며, 이용자의 권익 보호에 최선을 다하고 있습니다.
          </p>

          <h2>1. 개인정보 수집 항목 및 방법</h2>
          <p>회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집하고 있습니다.</p>
          <ul>
            <li><strong>필수 수집 항목:</strong> 성명, 휴대전화번호, 이메일 주소, 소속(학원/학교명), 직책(원장/강사/학생), 로그인 ID(소셜 로그인 시 식별값)</li>
            {/* ▼ [추가] 보안 및 모니터링 목적 명시 */}
            <li><strong>서비스 안전성 확보 및 부정이용 방지:</strong> 접속 IP 정보, 쿠키, 접속 로그, 서비스 이용 기록, 기기 정보(User-Agent), 중복 로그인 방지용 세션값</li>
            <li><strong>결제 및 정산 관련:</strong> 신용카드 정보(일부), 은행명, 계좌번호, 예금주, 사업자등록번호(세금계산서 발행 시)</li>
            <li><strong>자동 수집 항목:</strong> 서비스 이용 기록, 접속 로그, 접속 IP 정보, 쿠키, 결제 기록</li>
          </ul>

          <h2>2. 개인정보의 수집 및 이용 목적</h2>
          <p>회사는 수집한 개인정보를 다음의 목적을 위해 활용합니다.</p>
          <ul>
            <li><strong>서비스 제공:</strong> 문제은행 및 컨텐츠 제공, 맞춤형 교재 제작, 결과물 발송, 요금 결제 및 정산</li>
            <li><strong>회원 관리:</strong> 회원제 서비스 이용에 따른 본인확인, 개인 식별, 불량회원의 부정 이용 방지, 가입 의사 확인, 민원 처리</li>
            <li><strong>마케팅 및 광고:</strong> 신규 서비스 개발, 접속 빈도 파악, 맞춤형 서비스 제공, 이벤트 정보 전달</li>
          </ul>

          <h2>3. 개인정보의 보유 및 이용 기간</h2>
          <p>
            원칙적으로, 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다. 단, 관계법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계법령에서 정한 일정한 기간 동안 회원정보를 보관합니다.
          </p>
          <ul>
            <li><strong>계약 또는 청약철회 등에 관한 기록:</strong> 5년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
            <li><strong>대금결제 및 재화 등의 공급에 관한 기록:</strong> 5년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
            <li><strong>소비자의 불만 또는 분쟁처리에 관한 기록:</strong> 3년 (전자상거래등에서의 소비자보호에 관한 법률)</li>
            <li><strong>접속에 관한 기록:</strong> 3개월 (통신비밀보호법)</li>
          </ul>

          <h2>4. 개인정보의 파기절차 및 방법</h2>
          <p>
            회사는 원칙적으로 개인정보 수집 및 이용목적이 달성된 후에는 해당 정보를 지체 없이 파기합니다.
          </p>
          <ul>
            <li><strong>파기절차:</strong> 회원님이 입력하신 정보는 목적이 달성된 후 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라(보유 및 이용기간 참조) 일정 기간 저장된 후 파기됩니다.</li>
            <li><strong>파기방법:</strong> 전자적 파일형태로 저장된 개인정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제하며, 종이에 출력된 개인정보는 분쇄하거나 소각하여 파기합니다.</li>
          </ul>

          <h2>5. 이용자 및 법정대리인의 권리와 그 행사방법</h2>
          <p>
            이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며 가입해지를 요청할 수 있습니다. 개인정보 조회/수정은 '프로필 설정'에서, 가입해지는 고객센터를 통해 신청할 수 있습니다.
          </p>

          <h2>6. 개인정보의 안전성 확보 조치</h2>
          <p>
            회사는 이용자의 개인정보를 취급함에 있어 개인정보가 분실, 도난, 누출, 변조 또는 훼손되지 않도록 안전성 확보를 위하여 기술적/관리적 대책을 강구하고 있습니다. (비밀번호 암호화, 해킹 방지 시스템 등)
          </p>

          <h2>7. 개인정보 보호책임자</h2>
          <p>
            회사는 고객의 개인정보를 보호하고 개인정보와 관련한 불만을 처리하기 위하여 아래와 같이 관련 부서 및 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <ul>
            <li><strong>개인정보 보호책임자:</strong> 이정한 (서비스 개발 팀장)</li>
            <li><strong>담당 부서:</strong> 서비스 개발팀 / 보안팀</li>
            <li><strong>연락처:</strong> contact@rulemakers.co.kr</li>
          </ul>

          <p className="mt-8 text-sm text-gray-500">
            본 개인정보처리방침은 2026년 1월 19일부터 적용됩니다.
          </p>
        </article>
      </div>
    </div>
  );
}