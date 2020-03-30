import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse } from '/opt/nodejs/controller';

export async function get_prizes(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  if (!event.pathParameters || !event.pathParameters.user_id) {
    return { code: 400, body: 'No user_id' };
  }

  const { user_id } = event.pathParameters;

  await model.telemetry.create('get-prizes', user_id);

  if (!event.requestContext.authorizer || user_id !== event.requestContext.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  // Does this user exist?
  const user = await model.user.get(user_id);

  if (!user) {
    return { code: 404, body: 'User does not exist.' };
  }

  return { code: 200, body: { points: user.points, prizes: user.prizes } };
}

export const handler = controller(get_prizes);
