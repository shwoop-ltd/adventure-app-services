import { Location } from './adventure-app';

export interface DBPrize {
  id: string;
  type: string;
  location: Location;
  received: string; // ISO date
  received_from: 'challenge' | 'treasure' | 'survey';
  redeemed: boolean;
  user_id: string;
}
