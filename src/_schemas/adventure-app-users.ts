
export interface DBUser {
  id: string;

  campaign: string;
  beta: boolean;

  points: number;
  surveys: { question: string; answer: string }[];
  prizes: string[];
  treasure: string[];
  challenges: string[];

  prerequisite_challenges_completed: number;
}
