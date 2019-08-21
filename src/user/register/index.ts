import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { DBUser } from 'schemas';
import { generate_telemetry, Users, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.userid)
    return response(400, "No userid");

  const user_id = event.pathParameters.userid;

  await generate_telemetry(event, "register-user", user_id);

  // Does this user exist already?
  let user = await Users.get(user_id);
  if(user)
    return response(409, "Conflict. Account already exists.");

  user = {
    id: user_id,
    points: 0,
    surveys: [],
    prizes: [],
    treasure: [],
    challenges: [],
    prerequisite_challenges_completed: 0,
  } as DBUser;

  await Users.put(user);
  return response(201, "Account created.");
}
