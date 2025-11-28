// hooks/useProblemFetcher.ts

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
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
      // 대주제가 하나도 선택되지 않았으면 검색하지 않음 (비용 절약)
      if (selectedMajorTopics.length === 0) {
        setProblems([]);
        return;
      }

      setLoading(true);
      try {
        const problemsRef = collection(db, 'problems');
        
        // Firestore 'in' 쿼리는 최대 10개까지만 가능하므로, 10개씩 잘라서 요청하거나
        // 여기서는 안전하게 상위 10개만 쿼리하고 나머지는 무시하는 형태로 구현 (실제론 10개 넘기 힘듦)
        const safeMajorTopics = selectedMajorTopics.slice(0, 10);

        const q = query(
          problemsRef,
          where('majorTopic', 'in', safeMajorTopics),
          limit(200) // 성능을 위해 최대 200문제로 제한
        );

        const snapshot = await getDocs(q);
        const fetchedData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as DBProblem));

        // [Client-side Filtering] : Firestore 쿼리의 한계를 JS로 보완
        let filtered = fetchedData;

        // 1. 소단원 필터 (선택된 소단원이 있는 경우에만 해당 소단원만 남김)
        // 로직: 대단원을 선택하면 기본적으로 다 보여주되, 사용자가 소단원을 '콕 집어' 선택하면 그것만 보여줌
        if (selectedMinorTopics.length > 0) {
           // 선택된 소단원이 하나라도 있으면, 그 소단원에 해당하는 문제만 필터링
           // (주의: 대단원만 체크하고 소단원은 체크 안 한 경우는 "전체"로 간주할지 결정 필요. 
           //  여기서는 '소단원 체크박스가 하나라도 눌렸으면 그것만 본다'는 로직)
           filtered = filtered.filter(p => selectedMinorTopics.includes(p.minorTopic));
        }

        // 2. 난이도 필터
        if (difficulties.length > 0) {
          filtered = filtered.filter(p => difficulties.includes(p.difficulty));
        }

        // 3. 정렬 (난이도 점수 오름차순 등 필요시 추가)
        filtered.sort((a, b) => a.difficultyScore - b.difficultyScore);

        setProblems(filtered);
      } catch (error) {
        console.error("Error fetching problems:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, [selectedMajorTopics, selectedMinorTopics, difficulties]);

  return { problems, loading };
}