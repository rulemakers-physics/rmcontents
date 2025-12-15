// types/examTemplates.ts

// [추가] LayoutMode 타입 정의 이동
export type LayoutMode = 'dense' | 'split-2' | 'split-4';

export type ExamTemplateStyle = {
  id: string;
  name: string;
  
  // 1. 레이아웃 & 간격
  headerHeight: string;     // 헤더 높이 (예: '120px')
  contentPadding: string;   // 시험지 내부 여백 (예: '20mm')
  columnGap: string;        // 다단 간격 (예: '12mm')
  problemGap: string;       // 문제 사이 간격 (예: 'mb-8')

  // 2. 타이포그래피 (폰트는 구글 폰트 등 로드 필요)
  fontFamily: string;       
  titleSize: string;        // 제목 크기
  problemFontSize: string;  // 문제 본문 크기
  
  // 3. 디자인 요소
  borderColor: string;      // 메인 테마 컬러
  numberStyle: 'simple' | 'circle' | 'box'; // 문제 번호 스타일
  headerType: 'underline' | 'box-table' | 'minimal'; // 헤더 스타일
  
  // 4. 브랜딩
  watermarkOpacity: number; // 0 ~ 1 (0이면 없음)
  showScoreBox: boolean;    // 점수 기입란 표시 여부
};

export const TEMPLATES: ExamTemplateStyle[] = [
  { 
    id: 'math-pro', 
    name: '심플', 
    headerHeight: '120px', 
    contentPadding: '15mm',
    columnGap: '12mm', 
    problemGap: 'mb-8',
    fontFamily: '"Noto Sans KR", sans-serif', 
    titleSize: 'text-3xl',
    problemFontSize: 'text-[15px]', // 조금 작고 빽빽하게
    borderColor: '#1e293b', // 짙은 네이비 (Slate-800)
    numberStyle: 'box',     // 번호에 네모 박스
    headerType: 'box-table',// 이름/점수 박스형 헤더
    watermarkOpacity: 0.05, // 은은한 워터마크
    showScoreBox: true
  },
  { 
    id: 'classic-serif', 
    name: '모의고사', 
    headerHeight: '90px', 
    contentPadding: '20mm',
    columnGap: '15mm', 
    problemGap: 'mb-10',
    fontFamily: '"Noto Serif KR", serif', // 명조체
    titleSize: 'text-2xl',
    problemFontSize: 'text-base',
    borderColor: '#000000', 
    numberStyle: 'circle',
    headerType: 'underline',
    watermarkOpacity: 0,
    showScoreBox: false
  },
  { 
    id: 'academy-brand', 
    name: '교재 스타일', 
    headerHeight: '80px', 
    contentPadding: '12mm',
    columnGap: '10mm', 
    problemGap: 'mb-6',
    fontFamily: '"Pretendard", sans-serif', 
    titleSize: 'text-2xl',
    problemFontSize: 'text-sm',
    borderColor: '#2563eb', // Royal Blue
    numberStyle: 'simple',
    headerType: 'minimal',
    watermarkOpacity: 0.03,
    showScoreBox: true
  }
];