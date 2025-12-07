// hooks/useProblemFetcher.ts

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, DocumentData } from 'firebase/firestore';
import { DBProblem, Difficulty } from '@/types/problem';

interface FilterProps {
  selectedMajorTopics: string[];
  selectedMinorTopics: string[];
  difficulties: Difficulty[];
  // [추가] 제외할 문제 ID 목록 (선택 사항)
  excludedProblemIds?: string[];
}

export function useProblemFetcher({ 
  selectedMajorTopics, 
  selectedMinorTopics, 
  difficulties,
  excludedProblemIds = [] // [추가] 기본값 빈 배열
}: FilterProps) {
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
        
        // 1. 과부하 방지를 위해 상위 5개의 대단원만 처리 (필요시 조정)
        const targetTopics = selectedMajorTopics.slice(0, 5);

        // 2. 병렬 쿼리 실행
        const promises = targetTopics.map(async (topic) => {
          // 난이도 필터가 있으면 쿼리에 포함
          const constraints = [
            where('majorTopic', '==', topic),
            limit(50) // 단원별 최대 50문제
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

        // 4. 소단원(Minor Topic) 필터링
        if (selectedMinorTopics.length > 0) {
           allFetched = allFetched.filter(p => selectedMinorTopics.includes(p.minorTopic));
        }

        // ▼▼▼ [추가] 5. 이미 사용한 문항(Excluded IDs) 필터링 ▼▼▼
        if (excludedProblemIds.length > 0) {
          // 제외 목록에 포함되지 않은 문제만 남김
          allFetched = allFetched.filter(p => !excludedProblemIds.includes(p.id));
        }
        // ▲▲▲ [추가 끝] ▲▲▲

        // 6. 랜덤 셔플 (매번 다른 문제 나오도록)
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
  }, [selectedMajorTopics, selectedMinorTopics, difficulties, excludedProblemIds]); // [수정] 의존성 배열 추가

  return { problems, loading };
}