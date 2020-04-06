import Model from './model';
import { PrizePool } from './types';

export interface Challenge extends PrizePool {
  id: string /* challenge-{map}-{id} */;

  // Clue stuff
  text?: string;
  image_url?: string;
  radius?: number;

  // Beacon id to use
  solution: string;
}

export default class ChallengeModel extends Model {
  public get = (map: string, id: string) => this.driver.get_item<Challenge>('challenge', `challenge-${map}-${id}`);
  public put = (challenge: Challenge) => this.driver.put_item('challenge', challenge);
}
