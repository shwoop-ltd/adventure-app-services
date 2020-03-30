import Model from './model';
import { Location } from './types';

export interface MapCollection {
  id: 'maps';
  maps: {
    // The name of the map used for further backend requests
    name: string;
    // A polygon representing the area of the map
    area: Location[];
  }[];
}

export interface Map {
  id: string;

  // A list of the challenges in the map
  challenges: {
    id: number;
    location: Location;

    // Challenge requirements
    prerequisites?: number;
    // Whether the challenge can be used as a prerequisite to other challenges
    is_prerequisite?: boolean;

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

export class MapModel extends Model {
  public get_all = () => this.driver.get_item<MapCollection>('maps', '', true);
  public get = (id: string) => this.driver.get_item<Map>('map', id);
}
