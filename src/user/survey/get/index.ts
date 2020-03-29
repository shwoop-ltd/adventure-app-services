import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Users, response, AdventureApp, generate_telemetry } from '/opt/nodejs';

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters || !event.pathParameters.user_id) return response(400, 'Missing path parameters.');

  if (!event.requestContext.authorizer || event.pathParameters.user_id !== event.requestContext.authorizer.claims.sub)
    return response(401, 'Cannot access this user');

  // Get the user, as we need to find a survey the user has yet to answer
  const user = await Users.get(event.pathParameters.user_id);
  if (!user) return response(401, 'User does not exist.');

  const answered_questions = user.surveys.map(({ question }) => question);

  const surveys = await AdventureApp.get_surveys();
  if (!surveys) return response(502, 'Could not find survey');

  await generate_telemetry(event, 'get-survey', user.id);
  // Remove surveys that the user has answered
  const choices = surveys.surveys.filter(({ question }) => !answered_questions.includes(question));

  if (choices.length === 0) return response(204, '');
  else {
    return response(200, {
      ...choices[Math.floor(Math.random() * choices.length)],
      prize: surveys.prize_given,
    });
  }
}
