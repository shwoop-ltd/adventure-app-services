import { PrizePool, Coordinates } from './types';
import Model from './model';

export interface Treasure extends Coordinates, PrizePool {
  id: string /* treasure-{map}-{beacon} */;
}

export class TreasureModel extends Model {
  public get = (map: string, beacon: string) => this.driver.get_item<Treasure>('treasure', `treasure-${map}-${beacon}`);
  public put = (treasure: Treasure) => this.driver.put_item('treasure', treasure);
}
