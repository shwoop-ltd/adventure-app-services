export interface Location {
  latitude: string;
  longitude: string;
}
export type Coordinates = Location;

export type PrizeOption = { prize: 'points'; points: number } | { prize: string; points: undefined };
export interface PrizePool {
  claimed: number;
  prizes: ({ available: number } & PrizeOption)[];
}
