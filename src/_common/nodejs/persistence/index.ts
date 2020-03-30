import { APIGatewayProxyEvent } from 'aws-lambda';

import Driver from './drivers/driver';
import DynamoDBDriver from './drivers/dynamodb';
import { BeaconModel } from './models/beacon';
import ChallengeModel from './models/challenge';
import { MapModel } from './models/maps';
import { PrizeModel } from './models/prize';
import { SurveyModel } from './models/surveys';
import { TelemetryModel } from './models/telemetry';
import { TreasureModel } from './models/treasure';
import { UserModel } from './models/users';

export default class Persistence {
  public constructor(event: APIGatewayProxyEvent) {
    this.driver = new DynamoDBDriver();
    this.event = event;

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

  private event: APIGatewayProxyEvent;
  private driver: Driver;
}
