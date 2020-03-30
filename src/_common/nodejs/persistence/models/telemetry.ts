import { APIGatewayProxyEvent } from 'aws-lambda';
import Model from './model';
import Driver from '../drivers/driver';

export interface Telemetry {
  id: string;
  date: number;
  function_name: string;
  user_id?: string;
  headers: { [name: string]: string };
  parameters: {
    path: { [name: string]: string } | null;
    query: { [name: string]: string } | null;
  };
  body: string | null;
}

export class TelemetryModel extends Model {
  public constructor(driver: Driver, event: APIGatewayProxyEvent) {
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
        path: this.event.pathParameters,
        query: this.event.queryStringParameters,
      },
    };

    return this.driver.put_item('telemetry', object);
  }

  private event: APIGatewayProxyEvent;
}
