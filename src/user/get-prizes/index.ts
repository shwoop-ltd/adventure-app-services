import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { response, Users } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.user_id)
    return response(400, "No user_id");

  // Does this user exist?
  const user = await Users.get(event.pathParameters.user_id);
  if(!user)
    return response(404, "User does not exist.");

  return response(200, { points: user.points, prizes: user.prizes });
}
