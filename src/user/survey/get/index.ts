import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import Persistence from '/opt/nodejs/persistence';
import controller, { ApiResponse } from '/opt/nodejs/controller';

export async function get_survey(event: APIGatewayProxyEvent, model: Persistence): Promise<ApiResponse> {
  if (!event.pathParameters || !event.pathParameters.user_id) {
    return { code: 400, body: 'Missing path parameters.' };
  }

  if (!event.requestContext.authorizer || event.pathParameters.user_id !== event.requestContext.authorizer.claims.sub) {
    return { code: 401, body: 'Cannot access this user' };
  }

  // Get the user, as we need to find a survey the user has yet to answer
  const user = await model.user.get(event.pathParameters.user_id);
  if (!user) {
    return { code: 401, body: 'User does not exist.' };
  }

  const answered_questions = user.surveys.map(({ question }) => question);

  const surveys = await model.surveys.get();
  if (!surveys) {
    return { code: 502, body: 'Could not find survey' };
  }

  await model.telemetry.create('get-survey', user.id);
  // Remove surveys that the user has answered
  const choices = surveys.surveys.filter(({ question }) => !answered_questions.includes(question));

  if (choices.length === 0) {
    return { code: 204, body: '' };
  } else {
    return {
      code: 200,
      body: {
        ...choices[Math.floor(Math.random() * choices.length)],
        prize: surveys.prize_given,
      },
    };
  }
}

export const handler = controller(get_survey);
