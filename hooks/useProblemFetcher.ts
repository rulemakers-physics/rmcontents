// hooks/useProblemFetcher.ts

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy, DocumentData } from 'firebase/firestore';
import { DBProblem, Difficulty } from '@/types/problem';

interface FilterProps {
  selectedMajorTopics: string[];
  selectedMinorTopics: string[];
  difficulties: Difficulty[];
  excludedProblemIds?: string[];
  // [수정] 선택적(?.) 속성으로 변경하거나, 아래 구조 분해 할당에서 기본값을 줘야 함
  questionTypes?: string[]; 
}

export function useProblemFetcher({ 
  selectedMajorTopics, 
  selectedMinorTopics, 
  difficulties,
  excludedProblemIds = [],
  // [핵심 수정] 값이 전달되지 않았을 때를 대비해 기본값 설정
  questionTypes = ['SELECTION'] 
}: FilterProps) {
  const [problems, setProblems] = useState<DBProblem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProblems = async () => {
      if (selectedMajorTopics.length === 0) {
        setProblems([]);
        return;
      }

      setLoading(true);
      try {
        const problemsRef = collection(db, 'problems');
        const targetTopics = selectedMajorTopics.slice(0, 5);

        const promises = targetTopics.map(async (topic) => {
          const constraints = [
            where('majorTopic', '==', topic),
            limit(200) 
          ];

          if (difficulties.length > 0) {
             constraints.push(where('difficulty', 'in', difficulties));
          }

          const q = query(problemsRef, ...constraints);
          const snapshot = await getDocs(q);
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DBProblem));
        });

        const chunkedResults = await Promise.all(promises);
        let allFetched = chunkedResults.flat();

        // 1. 소단원 필터링
        if (selectedMinorTopics.length > 0) {
           allFetched = allFetched.filter(p => selectedMinorTopics.includes(p.minorTopic));
        }

        // 2. 제외 문항 필터링
        if (excludedProblemIds.length > 0) {
          allFetched = allFetched.filter(p => !excludedProblemIds.includes(p.id));
        }

        // 3. [수정] 질문 형식 필터링 (안전 장치 추가)
        // questionTypes가 배열인지 확인 후 로직 수행
        if (Array.isArray(questionTypes) && questionTypes.length > 0) {
          allFetched = allFetched.filter(p => {
            const type = (p as any).questionType || 'SELECTION';
            return questionTypes.includes(type);
          });
        }

        // 4. 셔플
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
  }, [selectedMajorTopics, selectedMinorTopics, difficulties, excludedProblemIds, questionTypes]);

  return { problems, loading };
}