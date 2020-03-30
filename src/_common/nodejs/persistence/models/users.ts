import Model from './model';

export interface User {
  id: string;

  campaign: string;
  beta: boolean;

  points: number;
  surveys: { question: string; answer: string }[];
  prizes: string[];
  treasure: string[];
  challenges: number[];

  prerequisite_challenges_completed: number;
}

export class UserModel extends Model {
  public get = (id: string) => this.driver.get_item<User>('user', id);
  public put = (user: User) => this.driver.put_item('user', user);
}
