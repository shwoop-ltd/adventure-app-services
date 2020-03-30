import { PrizePool, PrizeOption, Coordinates } from './persistence/models/types';

export function get_next_prize(prize_pool: PrizePool): PrizeOption | undefined {
  const { prizes, claimed } = prize_pool;

  let total = 0;
  for (let i = 0; i < prizes.length; i += 1) {
    const { available, ...prize_info } = prizes[i];
    total += available;

    if (claimed < total) return prize_info;
  }

  return undefined;
}

interface PrizeResponse {
  id: string;
  location: Coordinates;
  type: string;
  received_from: string;
  received: string;
  redeemed: boolean;
  points?: number;
}

export function create_points_prize_response(
  points: number,
  location: Coordinates,
  received_from: 'survey' | 'challenge' | 'treasure'
): PrizeResponse {
  return {
    id: 'points',
    type: 'points',
    location,
    received_from,
    received: new Date().toISOString(),
    redeemed: true,
    points,
  };
}
