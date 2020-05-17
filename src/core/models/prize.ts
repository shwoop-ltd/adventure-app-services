import { Driver } from '../persistence';
import Model from './model';
import { UserModel } from './users';
import { Location } from './types';

export interface Prize {
  id: string;
  type: string;
  location: Location;
  received: string; // ISO date
  received_from: 'challenge' | 'treasure' | 'survey';
  redeemed: boolean;
  user_id: string;
}

export interface PrizeType {
  name: string;
  image_url: string;

  code?: string;

  display_name: string;
  instance_name: string;
  description: string;

  redeem_type?: 'in-store' | 'online';
  redeem_message: string;
}
export interface PrizeTypeCollection {
  id: 'prize-types';
  prizes: PrizeType[];
}

export class PrizeModel extends Model {
  public constructor(protected driver: Driver, protected user: UserModel) {
    super(driver);
  }

  public get = (id: string) => this.driver.get_item<Prize>('prize', id);
  public put = (prize: Prize) => this.driver.put_item('prize', prize);
  public get_all_types = () => this.driver.get_item<PrizeTypeCollection>('prize-types', 'prize-types', true);

  /**
   * @param user_id The user the prize is attached to
   * @param type The product/thing being awarded
   * @param received_from A source of the prize, can be from a survey, a challenge, or by finding treasure
   * @param update_user Whether or not to update the user, or if that is done externally
   * @param location The location at which the prize is placed.
   */
  public async create(
    user_id: string,
    type: string,
    received_from: 'survey' | 'challenge' | 'treasure',
    update_user = false,
    location: Location
  ) {
    // TODO: Replace this.
    function generate_id(length: number) {
      const valid_chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

      let id = '';
      for (let i = 0; i < length; i += 1) {
        id += valid_chars.charAt(Math.floor(Math.random() * valid_chars.length));
      }

      return id;
    }

    const prize: Prize = {
      id: generate_id(12),
      user_id,
      location,
      type,
      received_from,
      received: new Date().toISOString(),
      redeemed: false,
    };

    // TODO: Check for id collision
    await this.put(prize);

    if (update_user) {
      const user = await this.user.get(user_id);
      if (!user) {
        throw new Error(`Expected user ${user} to exist`);
      }

      user.prizes.push(prize.id);
      await this.user.put(user);
    }
    return prize;
  }
}
