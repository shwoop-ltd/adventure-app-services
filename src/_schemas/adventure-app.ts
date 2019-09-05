// NOTE: This file can be seperate because it only contains types,
// so the typescript compiler will do away with the import when it's compiled into js.
// This same method CANNOT be used for code.

export interface Location {
  latitude: string;
  longitude: string;
}

export type PrizeOption =
  | { prize: 'points'; points: number }
  | { prize: string; points: undefined }

export interface PrizePool {
  claimed: number;
  prizes: ({ available: number } & PrizeOption)[];
}

// Database types

export interface DBMapCollection {
  id: "maps";
  maps: {
    // The name of the map used for further backend requests
    name: string;
    // A polygon representing the area of the map
    area: Location[];
  }[];
}

export interface DBMapInfo {
  id: string;

  // A list of the challenges in the map
  challenges: {
    id: number;
    location: Location;

    // Challenge requirements
    prerequisites?: number;

    release_date?: number;
    active_date?: number;
    end_date?: number;

    // A name for the marker's location. Used for debug purposes only
    name?: string;
  }[];

  // A list of events occuring in the map
  // TODO: Is this too much info to put into this object?
  events: {
    location: Location;

    // A markdown description of the event
    description: string;
  };
}

// TODO: Move this into map object?
export interface DBBeacon {
  id: string; /* beacon-{map}-{beacon_id} */
  beacon_type: 'challenge-completer' | 'treasure';
}

export interface DBChallenge extends PrizePool {
  id: string; /* challenge-{map}-{id} */

  // Clue stuff
  text?: string;
  image_url?: string;

  // Beacon id to use
  solution: string;

  // Whether the challenge can be used as a prerequisite to other challenges
  // TODO: Construct a proper logic for this (e.g. it must be a 'special' challenge to not be a prerequisite)
  is_prerequisite?: boolean;
}

export interface DBTreasure extends Location, PrizePool {
  id: string; /* treasure-{map}-{beacon} */
}

export interface DBSurveyCollection {
  id: "surveys";
  surveys: {
    question: string;
    answers: string[];
    location: Location;
  }[];
  prize_given: {
    prize: string;
    surveys_to_prize: number;
  };
}

export interface DBPrizeType {
  name: string;
  image_url: string;

  display_name: string;
  instance_name: string;
  description: string;

  redeem_type?: "in-store" | "online";
  redeem_message: string;
}
export interface DBPrizeTypeCollection {
  id: "prize-types";
  prizes: DBPrizeType[];
}
