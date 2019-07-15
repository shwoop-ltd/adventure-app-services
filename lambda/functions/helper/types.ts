
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
  { beacon_type: 'marker', marker: number } |
  { beacon_type: 'treasure' } |
  { beacon_type: 'hidden' };

export interface DBChallenge {
  id: string;

  text?: string;
  image_url?: string;
  solution: string;

  prerequisites?: number;
  is_prerequisite?: boolean;

  prizes: { prize: string; available: number; points?: number; }[];
  claimed: number;
}

export interface DBSurveyCollection {
  id: string;
  surveys: {
    question: string;
    answers: string[];
  }[];
}
