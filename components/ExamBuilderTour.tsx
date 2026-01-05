// components/ExamBuilderTour.tsx

"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function ExamBuilderTour() {
  useEffect(() => {
    // 1. 재방문 여부 확인 (버전 업데이트 v5)
    const hasSeen = localStorage.getItem("hasSeenExamBuilderTour_v5");
    if (hasSeen) return;

    // 2. Driver 인스턴스 생성
    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      doneBtnText: "시작하기",
      nextBtnText: "다음",
      prevBtnText: "이전",
      progressText: "{{current}} / {{total}}",
      // [디자인] 하이라이트 박스 스타일링 (여백 등)
      stagePadding: 4,
      steps: [
        { 
          element: '#tab-units', 
          popover: { 
            title: '1. 단원 선택', 
            description: '가장 먼저 이곳에서 "출제할 단원"을 선택합니다.<br/>대단원과 소단원을 체크하면 문제가 자동으로 구성됩니다.',
            side: "bottom",
            align: 'start'
          },
          onHighlightStarted: () => {
             document.getElementById('tab-units')?.click();
          }
        },
        { 
          element: '#tab-settings', 
          popover: { 
            title: '2. 구성 설정', 
            description: '난이도별 문항 수, 문제 유형(객/주관식), 인쇄 레이아웃 등 "시험지의 세부 옵션"을 조정하는 탭입니다.',
            side: "bottom",
            align: 'start'
          },
          onHighlightStarted: () => {
             document.getElementById('tab-settings')?.click();
          }
        },
        { 
          element: '#tab-order', 
          popover: { 
            title: '3. 문항 순서 및 교체', 
            description: '문제를 드래그하여 "순서를 변경"하거나,<br/>마음에 들지 않는 문제를 "유사 문항"으로 즉시 교체할 수 있습니다.',
            side: "bottom",
            align: 'start'
          },
          onHighlightStarted: () => {
             document.getElementById('tab-order')?.click();
          }
        },
        { 
          element: '#maker-preview-stage', 
          popover: { 
            title: '4. 실시간 미리보기', 
            description: '좌측에서 설정한 내용이 반영된 시험지를 바로 확인하세요.<br/>실제 인쇄될 모습과 동일합니다.',
            side: "left",
            align: 'center'
          } 
        },
        { 
          element: '#maker-exam-title', 
          popover: { 
            title: '5. 기본 정보 입력', 
            description: '반을 선택하고, 시험지 제목, 부제, 학원명, 학원 로고, 선생님 성함을 입력하여 선생님만의 시험지를 완성하세요.',
            side: "bottom",
            align: 'start'
          } 
        },
        { 
          element: '#maker-save-button', 
          popover: { 
            title: '6. 저장 및 완료', 
            description: '모든 설정이 끝났다면 [보관함 저장]을 눌러주세요.<br/>PDF 다운로드 및 인쇄는 보관함에서 가능합니다.',
            side: "bottom",
            align: 'end'
          } 
        },
      ],
      // 투어 종료 시 처리
      onDestroyed: () => {
        localStorage.setItem("hasSeenExamBuilderTour_v5", "true");
        // 투어 종료 후 다시 첫 번째 탭(단원 선택)으로 복귀
        document.getElementById('tab-units')?.click();
      },
    });

    // 3. 약간의 딜레이 후 실행 (UI 렌더링 확보)
    const timer = setTimeout(() => {
      driverObj.drive();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
}