import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { response, Users } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.userid)
    return response(400, "No userid");

  // Does this user exist?
  const user = await Users.get(event.pathParameters.userid);
  if(!user)
    return response(404, "User does not exist.");

  return response(200, { points: user.points, prizes: user.prizes });
}
