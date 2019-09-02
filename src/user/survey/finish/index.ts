import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  generate_telemetry, response, Users, AdventureApp,
} from '/opt/nodejs';

interface Body {
  question: string;
  answer: string;
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.user_id)
    return response(400, "Missing path parameters.");

  if(!event.body)
    return response(400, "Body not present");

  const { user_id } = event.pathParameters;

  if(!event.requestContext.authorizer || user_id !== event.requestContext.authorizer.claims.sub) {
    await generate_telemetry(event, "unusual-access", user_id);
    return response(401, "Cannot access this user");
  }

  await generate_telemetry(event, "finish-survey", user_id);

  const body = JSON.parse(event.body) as Body;

  // Does this user exist?
  const user = await Users.get(user_id);
  if(!user)
    return response(401, "User does not exist.");

  const answered_questions = user.surveys.map(({ question }) => question);
  if(answered_questions.includes(body.question))
    return response(409, "Question already completed or no question found.");

  // TODO: Cache request?
  const surveys = await AdventureApp.get_surveys();
  if(!surveys)
    return response(502, "Could not find survey");

  const answered_survey = surveys.surveys.find(({ question }) => question === body.question);
  if(!answered_survey)
    return response(404, "Survey does not exist");

  if(!answered_survey.answers.includes(body.answer))
    return response(400, "Answer must be from one of the given options in the survey");

  user.surveys.push({ question: body.question, answer: body.answer });

  // TODO: Determine a prize to give to the user

  // Update user info with the previously inserted survey
  await Users.put(user);

  return response(201, false);
}
