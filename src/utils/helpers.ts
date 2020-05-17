import { PrizePool, PrizeOption, Coordinates, Location } from '../persistence/models/types';

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

export function get_distance(point1: Location, point2: Location) {
  const lat1 = Number(point1.latitude);
  const lon1 = Number(point1.longitude);
  const lat2 = Number(point2.latitude);
  const lon2 = Number(point2.longitude);
  var R = 6371000; // Radius of the earth in m
  var dLat = deg_to_rad(lat2 - lat1);
  var dLon = deg_to_rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg_to_rad(lat1)) * Math.cos(deg_to_rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in m
  return d;

  function deg_to_rad(deg: number) {
    return deg * (Math.PI / 180);
  }
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
