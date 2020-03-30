import { APIGatewayProxyEvent } from 'aws-lambda';
import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse } from '/opt/nodejs/controller';

export async function get_prize(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  if (!event.pathParameters) {
    return { code: 400, body: 'No path parameters' };
  }

  const result = await model.prize.get(event.pathParameters.code);

  if (result) {
    return { code: 200, body: result };
  } else {
    return { code: 404, body: `Code ${event.pathParameters.code} was not found` };
  }
}

export const handler = controller(get_prize);
