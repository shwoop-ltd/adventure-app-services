import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { AdventureApp, response } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters) return response(400, 'No path parameters');

  // Get Map
  const { map } = event.pathParameters;
  const map_info = await AdventureApp.get_map(map);

  // Map Check
  if (!map_info) return { statusCode: 404, body: 'Map not found' };

  // Filter Map Info to currently open and time to next.
  const time = Date.now() / 1000;

  // Allow elements that either do not have a release time (considered timeless) or whose life time covers the current date.
  // Elements with a release time and no duration are assumed to be available forever after release
  const challenges = map_info.challenges.filter(
    ({ release_date, end_date }) => (!release_date || release_date < time) && (!end_date || end_date > time)
  );

  const next_release = Math.min(
    ...map_info.challenges
      .filter(({ release_date }) => release_date && release_date > time) // Filters to future objects
      .map(({ release_date }) => release_date as number)
  ); // Converts objects into just release time

  const return_data = {
    ...map_info,
    challenges,
    next_release,
  };

  return { statusCode: 200, body: JSON.stringify(return_data) };
}
