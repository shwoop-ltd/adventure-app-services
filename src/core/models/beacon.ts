import Model from './model';

export interface Beacon {
  id: string /* beacon-{map}-{beacon_id} */;
  beacon_type: 'challenge-completer' | 'treasure';
}

export class BeaconModel extends Model {
  public get = (map: string, id: string) => this.driver.get_item<Beacon>('beacon', `beacon-${map}-${id}`);
}
