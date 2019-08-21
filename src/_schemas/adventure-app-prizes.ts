
export interface DBPrize {
  id: string;
  type: string;
  received: string; // ISO date
  received_from: 'challenge' | 'treasure' | 'survey';
  redeemed: boolean;
  user_id: string;
}
