import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

import { AdventureApp, Users, response } from "/opt/nodejs";

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters)
    return response(400, "Need the user and the challenge id");

  const { user_id, map } = event.pathParameters;

  let challenge_id: number;
  try {
    challenge_id = Number.parseInt(event.pathParameters.challenge_id, 10);
  }
  catch(e) {
    return response(400, "challenge_id must be a number");
  }

  const challenge = await AdventureApp.get_challenge(map, challenge_id);
  if(!challenge)
    return response(404, "No challenge with that ID.");

  const map_info = await AdventureApp.get_map(map);
  if(!map_info)
    return response(404, `Map ${map} not found`);

  const marker = map_info.challenges.find(({ id }) => id === challenge_id);
  if(!marker)
    return response(404, `Marker ${challenge_id} does not exist`);

  // Prerequisite challenge checking
  if(marker.prerequisites) {
    // Check whether user has prerequisites
    const user = await Users.get(user_id);
    if(!user)
      return response(404, "User not found");

    if(user.prerequisite_challenges_completed < marker.prerequisites)
      return response(402, "Prerequisite challenges not completed");
  }

  // Logic time:
  // We test whether the time is greater than the active start date,
  // which is either active_date (if it exists), or else release_date (if that exists)
  // We then check that we are not past the end date (if that exists).
  const time = Date.now() / 1000;
  if(
    (marker.active_date || marker.release_date || 0) > time
    || (marker.end_date || time) < time
  )
    return response(400, "This challenge is not available right now");

  return response(200, {
    text: challenge.text,
    image_url: challenge.image_url,
  });
}
