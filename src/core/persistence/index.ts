import { ApiRequest } from '../../lambdas/-helpers/request-handler/types';
import { BeaconModel } from '../models/beacon';
import ChallengeModel from '../models/challenge';
import { MapModel } from '../models/maps';
import { PrizeModel } from '../models/prize';
import { SurveyModel } from '../models/surveys';
import { TelemetryModel } from '../models/telemetry';
import { TreasureModel } from '../models/treasure';
import { UserModel } from '../models/users';

export class Persistence {
  public constructor(private event: ApiRequest, private driver: Driver) {
    this.beacon = new BeaconModel(this.driver);
    this.challenge = new ChallengeModel(this.driver);
    this.map = new MapModel(this.driver);
    this.surveys = new SurveyModel(this.driver);
    this.treasure = new TreasureModel(this.driver);
    this.user = new UserModel(this.driver);

    this.telemetry = new TelemetryModel(this.driver, this.event);
    this.prize = new PrizeModel(this.driver, this.user);
  }

  public beacon: BeaconModel;
  public challenge: ChallengeModel;
  public map: MapModel;
  public prize: PrizeModel;
  public surveys: SurveyModel;
  public telemetry: TelemetryModel;
  public treasure: TreasureModel;
  public user: UserModel;
}

export type StoreRecord = { id: string };

export type Key =
  | 'beacon'
  | 'challenge'
  | 'map'
  | 'maps'
  | 'prize-types'
  | 'prize'
  | 'surveys'
  | 'telemetry'
  | 'treasure'
  | 'user';

export abstract class Driver {
  public abstract async get_item<T>(key: Key, id: string, always_exists: true): Promise<T>;
  /**
   * Get an item in the table
   * @param key The model to get
   * @param id The id of the model. If no id is present, assumes it's a singleton item
   * @param always_exists Whether or not to assume the object exists. Defaults to false
   */
  public abstract async get_item<T>(key: Key, id: string, always_exists?: boolean): Promise<T | undefined>;

  public abstract async put_item(key: Key, item: { id: string }): Promise<void>;

  /**
   * Get an array of items in the table
   * @param key The model to get
   * @param use_filter Specify if the model id should contain the key, useful when a table is shared by more than one model
   * @param attributes The attributes of the model to return. If not present, returns all attributes
   */
  public abstract async scan_table<T extends StoreRecord>(
    key: Key,
    use_filter: boolean,
    attributes?: string[]
  ): Promise<T[]>;
}
