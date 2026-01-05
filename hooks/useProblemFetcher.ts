// hooks/useProblemFetcher.ts

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { DBProblem, Difficulty } from '@/types/problem';

interface FilterProps {
  selectedMajorTopics: string[];
  selectedMinorTopics: string[];
  difficulties: Difficulty[];
  excludedProblemIds?: string[];
  questionTypes?: string[];
  excludeNonCurriculum?: boolean;
}

export function useProblemFetcher({ 
  selectedMajorTopics, 
  selectedMinorTopics, 
  difficulties,
  excludedProblemIds = [],
  questionTypes = ['SELECTION', 'ESSAY'],
  excludeNonCurriculum = false
}: FilterProps) {
  const [problems, setProblems] = useState<DBProblem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProblems = useCallback(async () => {
    // 대단원조차 선택되지 않았다면 초기화
    if (selectedMajorTopics.length === 0) {
      setProblems([]);
      return;
    }

    setLoading(true);
    try {
      const problemsRef = collection(db, 'problems');
      const promises: Promise<any>[] = [];

      // [전략 변경] 소단원별 개별 쿼리 실행 (병렬 처리)
      // 이유: 청크(Chunk) 단위로 limit을 걸면, 특정 단원의 문제만 가져오고 나머지는 잘릴 위험이 있음.
      //       소단원별로 쿼리를 나누면 '모든 선택된 소단원'의 문제를 확실하게 확보 가능.
      
      if (selectedMinorTopics.length > 0) {
        selectedMinorTopics.forEach((topic) => {
          const constraints = [
            where('minorTopic', '==', topic),
            // 소단원을 == 로 지정했으므로, 난이도는 IN 쿼리 사용 가능 (최대 10개 허용)
            // difficulties가 비어있으면 필터링하지 않음 (전체 조회)
            ...(difficulties.length > 0 ? [where('difficulty', 'in', difficulties)] : []),
            limit(300) // 각 소단원별로 충분한 풀(Pool) 확보 (예: 300개)
          ];

          const q = query(problemsRef, ...constraints);
          promises.push(getDocs(q));
        });
      } 
      // 소단원 미선택 시 (대단원 기준) -> 기존 방식 유지하되 Limit 상향
      else {
        selectedMajorTopics.forEach((topic) => {
          const constraints = [
            where('majorTopic', '==', topic),
            ...(difficulties.length > 0 ? [where('difficulty', 'in', difficulties)] : []),
            limit(1000) // 대단원 기준이므로 넉넉하게
          ];
          const q = query(problemsRef, ...constraints);
          promises.push(getDocs(q));
        });
      }

      // 병렬 쿼리 결과 대기
      const snapshots = await Promise.all(promises);
      
      // 결과 병합 및 중복 제거
      const allFetchedMap = new Map<string, DBProblem>();
      
      snapshots.forEach(snap => {
        snap.docs.forEach((doc: any) => {
          // 중복 문서 방지 (Map 사용)
          if (!allFetchedMap.has(doc.id)) {
            allFetchedMap.set(doc.id, { id: doc.id, ...doc.data() } as DBProblem);
          }
        });
      });

      let allFetched = Array.from(allFetchedMap.values());

      // --- [2차 메모리 필터링] ---
      // DB 쿼리에서 처리하지 못한 나머지 조건들 적용

      // 1. 문항 유형 필터링
      if (questionTypes.length > 0) {
        allFetched = allFetched.filter(p => {
          const type = p.questionType || 'SELECTION'; 
          return questionTypes.includes(type);
        });
      }

      // 2. 교육과정 외 제외
      if (excludeNonCurriculum) {
        allFetched = allFetched.filter(p => p.materialLevel === "학교 교과서");
      }

      // 3. 사용된 문항 제외
      if (excludedProblemIds.length > 0) {
        const excludedSet = new Set(excludedProblemIds);
        allFetched = allFetched.filter(p => !excludedSet.has(p.id));
      }

      // 4. 결과 셔플 (Fisher-Yates) - 클라이언트에서 랜덤성 부여
      for (let i = allFetched.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allFetched[i], allFetched[j]] = [allFetched[j], allFetched[i]];
      }

      console.log(`[ProblemFetcher] Total loaded: ${allFetched.length} problems`);
      setProblems(allFetched);

    } catch (error) {
      console.error("문항 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [
    JSON.stringify(selectedMajorTopics), 
    JSON.stringify(selectedMinorTopics), 
    JSON.stringify(difficulties), 
    JSON.stringify(questionTypes),
    excludeNonCurriculum,
    excludedProblemIds.length
  ]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return { problems, loading };
}