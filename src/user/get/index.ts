import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { Users, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.user_id)
    return response(400, "No user_id");

  const { user_id } = event.pathParameters;

  if(!event.requestContext.authorizer || user_id !== event.requestContext.authorizer.claims.sub)
    return response(401, "Cannot access this user");

  // Does this user exist?
  const user = await Users.get(user_id);
  if(!user)
    return response(404, "User does not exist");

  return response(200, user);
}
