import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse } from '/opt/nodejs/controller';

export async function register_user(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  if (!event.pathParameters || !event.pathParameters.user_id) {
    return { code: 400, body: 'No user_id' };
  }

  const { user_id } = event.pathParameters;

  if (!event.requestContext.authorizer || user_id !== event.requestContext.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  let body: { campaign: string; beta?: boolean };
  try {
    if (!event.body) {
      return { code: 400, body: 'Must have a body with campaign and potentially beta information' };
    }

    body = JSON.parse(event.body);

    if (!body || !body.campaign) {
      return { code: 400, body: 'Body must contain selected campaign' };
    }
  } catch (e) {
    return { code: 400, body: 'Must have json body' };
  }

  // Does this user exist?
  const beta = body.beta !== undefined ? body.beta : Math.random() < 0.01;

  const user = {
    id: user_id,
    campaign: body.campaign,
    beta,
    points: 0,
    surveys: [],
    prizes: [],
    treasure: [],
    challenges: [],
    prerequisite_challenges_completed: 0,
  };
  await model.user.put(user);

  await model.telemetry.create('register-user', user_id);

  return { code: 200, body: user };
}

export const handler = controller(register_user);
