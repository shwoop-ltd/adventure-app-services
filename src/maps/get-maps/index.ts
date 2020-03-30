import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse } from '/opt/nodejs/controller';

export async function get_maps(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  const maps = await model.map.get_all();

  if (maps) {
    return { code: 200, body: maps.maps };
  } else {
    return { code: 500, body: 'Maps not found!' };
  }
}

export const handler = controller(get_maps);
