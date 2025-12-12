// hooks/useProblemFetcher.ts

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, documentId } from 'firebase/firestore';
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

  // Firestore 'IN' 쿼리 제약(최대 30개) 해결을 위한 청크 함수
  const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  const fetchProblems = useCallback(async () => {
    // 대단원조차 선택되지 않았다면 로딩 X
    if (selectedMajorTopics.length === 0) {
      setProblems([]);
      return;
    }

    setLoading(true);
    try {
      const problemsRef = collection(db, 'problems');
      let allFetched: DBProblem[] = [];

      // [전략 1] 소단원이 선택된 경우 -> 소단원이 가장 강력한 필터이므로 이를 기준으로 쿼리 (가장 효율적)
      if (selectedMinorTopics.length > 0) {
        // 소단원들을 10개씩 묶어서 쿼리 (Firestore 'IN' 쿼리 제한 안전빵)
        const minorChunks = chunkArray(selectedMinorTopics, 10);
        
        const promises = minorChunks.map(async (chunk) => {
          // 주의: Firestore는 하나의 쿼리에 'IN' 연산자를 한 번만 사용할 수 있습니다.
          // 따라서 minorTopic에 IN을 쓰면, difficulty에는 IN을 쓸 수 없습니다.
          // -> 소단원으로 DB 필터링 후, 난이도는 메모리에서 2차 필터링합니다.
          const q = query(
            problemsRef, 
            where('minorTopic', 'in', chunk),
            limit(500) // 소단원별로는 데이터가 적으므로 충분
          );
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBProblem));
        });

        const results = await Promise.all(promises);
        allFetched = results.flat();

      } 
      // [전략 2] 소단원 미선택, 대단원만 선택된 경우
      else {
        const promises = selectedMajorTopics.map(async (topic) => {
          let q;
          // 난이도 필터가 있다면 여기서 DB 필터링 적용 (소단원 IN을 안 썼으므로 가능)
          if (difficulties.length > 0) {
             // 난이도도 10개 이상 선택될 일은 적지만 안전하게 처리 가능. 보통은 바로 넣음.
             q = query(
               problemsRef,
               where('majorTopic', '==', topic),
               where('difficulty', 'in', difficulties), 
               limit(500)
             );
          } else {
             q = query(
               problemsRef,
               where('majorTopic', '==', topic),
               limit(500)
             );
          }
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBProblem));
        });

        const results = await Promise.all(promises);
        allFetched = results.flat();
      }

      // --- [2차 메모리 필터링] ---
      // DB 쿼리 한계로 처리하지 못한 조건들을 여기서 수행합니다.

      // 1. 난이도 필터링 (소단원 검색을 했을 경우 DB에서 못 걸렀으므로 여기서 수행)
      if (selectedMinorTopics.length > 0 && difficulties.length > 0) {
        allFetched = allFetched.filter(p => difficulties.includes(p.difficulty));
      }

      // 2. 문항 유형 필터링
      if (questionTypes.length > 0) {
        allFetched = allFetched.filter(p => {
          const type = p.questionType || 'SELECTION'; 
          return questionTypes.includes(type);
        });
      }

      // 3. 교육과정 외 제외
      if (excludeNonCurriculum) {
        allFetched = allFetched.filter(p => p.materialLevel === "학교 교과서");
      }

      // 4. 사용된 문항 제외 (Set 자료구조로 O(1) 검색 최적화)
      if (excludedProblemIds.length > 0) {
        const excludedSet = new Set(excludedProblemIds);
        allFetched = allFetched.filter(p => !excludedSet.has(p.id));
      }

      // 5. 결과 셔플 (Fisher-Yates)
      for (let i = allFetched.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allFetched[i], allFetched[j]] = [allFetched[j], allFetched[i]];
      }

      console.log(`[ProblemFetcher] Loaded ${allFetched.length} problems`);
      setProblems(allFetched);

    } catch (error) {
      console.error("문항 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [
    // 의존성 배열 최적화: 내용물이 같으면 재실행되지 않도록
    JSON.stringify(selectedMajorTopics), 
    JSON.stringify(selectedMinorTopics), 
    JSON.stringify(difficulties), 
    JSON.stringify(questionTypes),
    excludeNonCurriculum,
    // excludedProblemIds는 자주 바뀌지 않거나 길이가 길 수 있으므로 length나 참조만 확인
    excludedProblemIds.length
  ]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  return { problems, loading };
}