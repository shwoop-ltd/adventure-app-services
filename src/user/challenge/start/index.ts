import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import { AdventureApp, Users, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters)
    return response(400, "Need the user and the challenge id");

  const { userid, challengeid } = event.pathParameters;

  const challenge = await AdventureApp.get_challenge_by_id(challengeid);
  if(!challenge)
    return response(404, "No challenge with that ID.");

  if(challenge.prerequisites) {
    // Check whether user has prerequisites
    const user = await Users.get(userid);
    if(!user)
      return response(404, "User not found");

    if(user.prerequisite_challenges_completed < challenge.prerequisites)
      return response(402, "Prerequisite challenges not completed");
  }

  return response(
    200,
    {
      text: challenge.text,
      image_url: challenge.image_url,
    },
  );
}
