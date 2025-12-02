// constants/researchers.ts

export const RESEARCHERS = [
  "김성배",
  "김호권",
  "김희경",
  "노유민",
  "이민지",
  "이정한",
  "이호열",
  "최명수"
] as const;

export type ResearcherName = typeof RESEARCHERS[number];