
// NOTE: This file can be seperate because it only contains types,
// so the typescript compiler will do away with the import when it's compiled into js.
// This same method CANNOT be used for code.

export interface Location {
  latitude: string;
  longitude: string;
}

// Database types

export interface DBMapCollection {
  id: string;
  maps: {
    name: string;
    top_left: Location;
    bottom_right: Location;
    image_url: string;
  }[];
}

export interface DBMapInfo {
  id: string;
  markers: {
    id: number;
    name?: string;
    location: Location;

    open?: boolean;

    release?: number;
    duration?: number;
  }[];
}

export type DBBeacon =
  { beacon_type: 'marker'; marker: number } |
  { beacon_type: 'treasure' } |
  { beacon_type: 'hidden' };

export interface DBChallenge {
  id: string;

  text?: string;
  image_url?: string;
  solution: string;

  prerequisites?: number;
  is_prerequisite?: boolean;

  prizes: { prize: string; available: number; points?: number }[];
  claimed: number;
}

export interface DBSurveyCollection {
  id: string;
  surveys: {
    question: string;
    answers: string[];
  }[];
}

export interface DBUser {
  id: string;

  points: number;
  surveys: { question: string; answer: string }[];
  prizes: string[];
  treasure: string[];
  challenges: string[];

  prerequisite_challenges_completed: number;
}

export interface DBPrizeType {
  name: string;
  image_url: string;

  display_name: string;
  instance_name: string;

  self_redeemable: boolean;
}

export interface DBPrize {
  id: string;
  type: string;
  received: string; // ISO date
  received_from: 'challenge' | 'treasure' | 'survey';
  redeemed: boolean;
  user_id: string;
}
