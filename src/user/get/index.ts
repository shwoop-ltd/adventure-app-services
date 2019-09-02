import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { Users, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.user_id)
    return response(400, "No user_id");

  const { user_id } = event.pathParameters;

  if(!event.requestContext.authorizer || user_id !== event.requestContext.authorizer.claims.sub)
    return response(401, "Cannot access this user");

  // Does this user exist?
  let user = await Users.get(user_id);
  if(!user) {
    user = {
      id: user_id,
      points: 0,
      surveys: [],
      prizes: [],
      treasure: [],
      challenges: [],
      prerequisite_challenges_completed: 0,
    };

    await Users.put(user);
  }

  return response(200, user);
}
