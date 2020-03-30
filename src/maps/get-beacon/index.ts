import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import controller, { ApiResponse } from '/opt/nodejs/controller';
import Persistence from '/opt/nodejs/persistence';

export async function get_beacon(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  if (!event.pathParameters) {
    return { code: 400, body: 'No path parameters' };
  }

  const { map, beacon } = event.pathParameters;
  const result = await model.beacon.get(map, beacon);

  if (result) {
    return { code: 200, body: result };
  } else {
    return { code: 404, body: `Beacon ${beacon} doesn't exist for map ${map}` };
  }
}

export const handler = controller(get_beacon);
