// hooks/useProblemFetcher.ts

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, DocumentData } from 'firebase/firestore';
import { DBProblem, Difficulty } from '@/types/problem';

interface FilterProps {
  selectedMajorTopics: string[];
  selectedMinorTopics: string[];
  difficulties: Difficulty[];
}

export function useProblemFetcher({ selectedMajorTopics, selectedMinorTopics, difficulties }: FilterProps) {
  const [problems, setProblems] = useState<DBProblem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      // 대주제가 선택되지 않았으면 패스
      if (selectedMajorTopics.length === 0) {
        setProblems([]);
        return;
      }

      setLoading(true);
      try {
        const problemsRef = collection(db, 'problems');
        const results: DBProblem[] = [];

        // [최적화 전략]
        // Firestore의 'in' 쿼리 제약(최대 10개)과 '서로 다른 필드의 in/array-contains 동시 사용 불가' 제약을 우회하기 위해,
        // 선택된 Major Topic 각각에 대해 별도의 쿼리를 병렬로 날려서 합칩니다.
        // 이렇게 하면 각 쿼리 내에서 where('difficulty', 'in', difficulties)를 안전하게 사용할 수 있습니다.
        
        // 1. 과부하 방지를 위해 상위 5개의 대단원만 처리 (필요시 조정)
        const targetTopics = selectedMajorTopics.slice(0, 5);

        // 2. 병렬 쿼리 실행
        const promises = targetTopics.map(async (topic) => {
          // 난이도 필터가 있으면 쿼리에 포함 (복합 인덱스 필요: majorTopic ASC + difficulty ASC)
          const constraints = [
            where('majorTopic', '==', topic),
            limit(50) // 단원별 최대 50문제 (총 250문제)
          ];

          if (difficulties.length > 0) {
             constraints.push(where('difficulty', 'in', difficulties));
          }

          const q = query(problemsRef, ...constraints);
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBProblem));
        });

        const chunkedResults = await Promise.all(promises);
        
        // 3. 결과 병합
        let allFetched = chunkedResults.flat();

        // 4. 소단원(Minor Topic) 필터링 (클라이언트 사이드)
        // 소단원 필터가 있다면, 해당 소단원이 아닌 것은 제거
        if (selectedMinorTopics.length > 0) {
           allFetched = allFetched.filter(p => selectedMinorTopics.includes(p.minorTopic));
        }

        // 5. 랜덤 셔플 (매번 다른 문제 나오도록)
        // Fisher-Yates Shuffle
        for (let i = allFetched.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allFetched[i], allFetched[j]] = [allFetched[j], allFetched[i]];
        }

        setProblems(allFetched);
      } catch (error) {
        console.error("Error fetching problems:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [selectedMajorTopics, selectedMinorTopics, difficulties]); // 의존성 배열

  return { problems, loading };
}