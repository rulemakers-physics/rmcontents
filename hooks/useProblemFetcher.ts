// hooks/useProblemFetcher.ts

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { DBProblem, Difficulty } from '@/types/problem';

interface FilterProps {
  selectedMajorTopics: string[];
  selectedMinorTopics: string[];
  difficulties: Difficulty[];
  excludedProblemIds?: string[];
  questionTypes?: string[]; // ['SELECTION', 'ESSAY']
}

export function useProblemFetcher({ 
  selectedMajorTopics, 
  selectedMinorTopics, 
  difficulties,
  excludedProblemIds = [],
  questionTypes = ['SELECTION', 'ESSAY'] // 기본값 설정
}: FilterProps) {
  const [problems, setProblems] = useState<DBProblem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      // 대단원이 선택되지 않았으면 로딩하지 않음
      if (selectedMajorTopics.length === 0) {
        setProblems([]);
        return;
      }

      setLoading(true);
      try {
        const problemsRef = collection(db, 'problems');
        
        // 1. 대단원별 병렬 쿼리 실행
        // (Firestore 'in' 쿼리 제약 회복 및 속도 향상)
        const promises = selectedMajorTopics.map(async (topic) => {
          const constraints = [
            where('majorTopic', '==', topic),
            // [핵심] Limit을 1000으로 대폭 상향하여 필터링 모수 확보
            limit(1000) 
          ];

          // 난이도 필터링 (DB 레벨에서 1차 필터링)
          if (difficulties.length > 0) {
             constraints.push(where('difficulty', 'in', difficulties));
          }

          const q = query(problemsRef, ...constraints);
          const snapshot = await getDocs(q);
          
          return snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as DBProblem));
        });

        // 모든 대단원의 결과를 하나로 합침
        const chunkedResults = await Promise.all(promises);
        let allFetched = chunkedResults.flat();

        // --- 2. 클라이언트(메모리) 정밀 필터링 ---

        // A. 소단원 필터링
        if (selectedMinorTopics.length > 0) {
           allFetched = allFetched.filter(p => selectedMinorTopics.includes(p.minorTopic));
        }

        // B. 문항 유형 필터링 (객관식/서답형)
        // DB 값("SELECTION")과 props 값("SELECTION")이 일치하므로 직접 비교
        if (questionTypes.length > 0) {
          allFetched = allFetched.filter(p => {
            // 데이터가 없거나 형식이 다를 경우를 대비해 방어적으로 처리
            const type = p.questionType || 'SELECTION'; 
            return questionTypes.includes(type);
          });
        }

        // C. 사용된 문항 제외 (최근 1달 내 사용된 문항)
        if (excludedProblemIds.length > 0) {
          // 배열 검색 성능(O(n))보다 Set 검색 성능(O(1))이 월등하므로 변환
          const excludedSet = new Set(excludedProblemIds);
          allFetched = allFetched.filter(p => !excludedSet.has(p.id));
        }

        // 3. 결과 셔플 (Fisher-Yates)
        for (let i = allFetched.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allFetched[i], allFetched[j]] = [allFetched[j], allFetched[i]];
        }

        console.log(`[ProblemFetcher] 최종 필터링된 문항 수: ${allFetched.length}`);
        setProblems(allFetched);

      } catch (error) {
        console.error("문항 로딩 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [
    // 의존성 배열 관리
    // [수정] 배열 참조값이 변경되어 무한 루프가 발생하는 것을 방지하기 위해
    // JSON.stringify를 사용하여 배열의 '내용'이 바뀔 때만 실행되도록 수정
    JSON.stringify(selectedMajorTopics), 
    JSON.stringify(selectedMinorTopics), 
    JSON.stringify(difficulties), 
    JSON.stringify(excludedProblemIds), 
    JSON.stringify(questionTypes)
  ]);

  return { problems, loading };
}