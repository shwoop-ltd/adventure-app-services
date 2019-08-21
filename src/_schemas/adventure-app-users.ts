
export interface DBUser {
  id: string;

  points: number;
  surveys: { question: string; answer: string }[];
  prizes: string[];
  treasure: string[];
  challenges: string[];

  prerequisite_challenges_completed: number;
}
