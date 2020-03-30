import { APIGatewayProxyEvent } from 'aws-lambda';
import Model from './model';
import Driver from '../drivers/driver';
import { ApiRequest } from '../../controller';

export interface Telemetry {
  id: string;
  date: number;
  function_name: string;
  user_id?: string;
  headers: { [name: string]: string };
  parameters: {
    path: { [name: string]: string | undefined };
    query: { [name: string]: string | undefined };
  };
  body: string | null;
}

export class TelemetryModel extends Model {
  public constructor(driver: Driver, event: ApiRequest) {
    super(driver);
    this.event = event;
  }

  public create(function_name: string, user_id?: string) {
    const date = Date.now() / 1000;

    const object: Telemetry = {
      id: `${date}-${function_name}`,
      date,
      user_id,
      function_name,
      headers: this.event.headers,
      body: this.event.body,
      parameters: {
        path: this.event.path,
        query: this.event.query,
      },
    };

    return this.driver.put_item('telemetry', object);
  }

  private event: ApiRequest;
}
