// components/ExamBuilderTour.tsx

"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function ExamBuilderTour() {
  useEffect(() => {
    // 1. 재방문 여부 확인 (로컬 스토리지 키 변경 v3)
    const hasSeen = localStorage.getItem("hasSeenExamBuilderTour_v3");
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
      steps: [
        { 
          element: '#maker-unit-selection', 
          popover: { 
            title: '1. 단원 선택', 
            description: '가장 먼저 출제할 **대단원**과 **소단원**을 체크해주세요.<br/>선택 즉시 조건에 맞는 문제들이 구성됩니다.',
            side: "right",
            align: 'start'
          } 
        },
        { 
          element: '#maker-right-sidebar', 
          popover: { 
            title: '2. 상세 조건 설정', 
            description: '난이도별 문항 수, 문제 유형(객관식/서술형), 레이아웃 등<br/>시험지의 세부 구성을 이곳에서 조정합니다.',
            side: "left",
            align: 'start'
          } 
        },
        { 
          element: '#maker-preview-stage', 
          popover: { 
            title: '3. 실시간 미리보기', 
            description: '설정에 따라 자동으로 생성된 시험지를 바로 확인하세요.<br/>실제 인쇄될 모습과 동일합니다.',
            side: "top",
            align: 'center'
          } 
        },
        { 
          element: '#maker-exam-title', 
          popover: { 
            title: '4. 시험지 정보 입력', 
            description: '시험지 제목, 학원명, 선생님 성함을 입력하여<br/>나만의 시험지를 완성하세요.',
            side: "bottom",
            align: 'start'
          } 
        },
        { 
          element: '#maker-save-button', 
          popover: { 
            title: '5. 저장 및 출력', 
            description: '모든 설정이 끝났다면 **[보관함 저장]**을 눌러주세요.<br/>PDF 변환 및 인쇄는 저장 후 보관함에서 가능합니다.',
            side: "bottom",
            align: 'end'
          } 
        },
      ],
      // 투어 종료 시 처리
      onDestroyed: () => {
        localStorage.setItem("hasSeenExamBuilderTour_v3", "true");
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