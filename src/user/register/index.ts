import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { Users, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.user_id)
    return response(400, "No user_id");

  const { user_id } = event.pathParameters;

  if(!event.requestContext.authorizer || user_id !== event.requestContext.authorizer.claims.sub)
    return response(401, "Cannot access this user");

  let body: { campaign: string; beta?: boolean };
  try {
    if(!event.body)
      return response(400, "Must have a body with campaign and potentially beta information");

    body = JSON.parse(event.body);

    if(!body || !body.campaign)
      return response(400, "Body must contain selected campaign");
  }
  catch(e) {
    return response(400, "Must have json body");
  }

  // Does this user exist?
  const beta = body.beta !== undefined ? body.beta : Math.random() > 0.1;

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
  await Users.put(user);

  return response(200, user);
}
