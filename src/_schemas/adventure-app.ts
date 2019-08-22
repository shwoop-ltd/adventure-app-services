// NOTE: This file can be seperate because it only contains types,
// so the typescript compiler will do away with the import when it's compiled into js.
// This same method CANNOT be used for code.

export interface Location {
  latitude: string;
  longitude: string;
}

// Database types

export interface DBMapCollection {
  id: "maps";
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

    prerequisites?: number;

    release_date?: number;
    active_date?: number;
    end_date?: number;
  }[];
}

export type DBBeacon =
  | { beacon_type: "marker"; marker: number }
  | { beacon_type: "treasure" }
  | { beacon_type: "hidden" };

export interface DBChallenge {
  id: string;

  text?: string;
  image_url?: string;
  solution: string;

  is_prerequisite?: boolean;

  prizes: { prize: string; available: number; points?: number }[];
  claimed: number;
}

export interface DBSurveyCollection {
  id: "surveys";
  surveys: {
    question: string;
    answers: string[];
  }[];
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

// TODO:
export interface DBTreasure extends Location {
  id: string;
  claimed: number;
  prizes: { prize: string; available: number; points?: number }[];
}
