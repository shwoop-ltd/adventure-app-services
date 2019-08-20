import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

interface Survey {
  question: string;
  answers: string;
}
interface CompletedSurvey {
  question: string;
  answer: string;
}

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

function generateRandomString(length: number) {
  let returnString = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for(let i = 0; i < length; i += 1)
    returnString += characters.charAt(Math.floor(Math.random() * characters.length));

  return returnString;
}

function add_telemetry(user_id: string, function_name: string, event: APIGatewayProxyEvent) {
  const telemetry_table_name = process.env.TELEMETRY_TABLE_NAME!;
  const telemetry_date = new Date();

  const telemetry_data = {
    id: `${user_id}-${function_name}-${telemetry_date.toISOString()}`,
    pathParameters: event.pathParameters,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers,
  };

  doc_client.put({ TableName: telemetry_table_name, Item: telemetry_data });
}

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if(!event.pathParameters || !event.pathParameters.userid)
    return { statusCode: 400, body: "Missing path parameters." };

  if(!event.body)
    return { statusCode: 400, body: "Body not present" };


  const body = JSON.parse(event.body) as CompletedSurvey;

  const user_id = event.pathParameters.userid;
  // Does this user exist?
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { id: user_id } }).promise();
  const user = user_result.Item;
  if(!user)
    return { statusCode: 401, body: "User does not exist." };

  const user_surveys = user.surveys as CompletedSurvey[];
  const answered_questions = user_surveys.map(({ question }) => question);

  add_telemetry(user_id, "finish-survey", event);

  const survey_result = await doc_client.get({ TableName: table_name, Key: { id: "surveys" } }).promise();
  if(!survey_result.Item)
    return { statusCode: 502, body: "Could not find survey" };

  const surveys = survey_result.Item.surveys as Survey[];
  const answered_survey = surveys.find(({ question }) => question === body.question);
  if(!answered_survey)
    return { statusCode: 404, body: "Survey does not exist" };

  if(answered_questions.includes(answered_survey.question))
    return { statusCode: 409, body: "Question already completed or no question found." };

  if(!answered_survey.answers.includes(body.answer))
    return { statusCode: 400, body: "Answer must be from one of the given options in the survey" };

  user_surveys.push({ question: body.question, answer: body.answer });


  // Create a prize to give to the user.
  // TODO: Prize should be determined by survey
  const d = new Date();
  const prize = {
    id: generateRandomString(8),
    type: "none",
    received: d.toISOString(),
    received_from: "survey",
    claimed: false,
    user_id,
  };
  // Set up updating user's prizes
  user.prizes.push(prize.id);

  // Update user info with the previously inserted survey and prize
  await doc_client.put({ TableName: users_table_name, Item: user }).promise();

  // Store prize in prize table
  await doc_client.put({ TableName: prizes_table_name, Item: prize }, () => {}).promise();

  return { statusCode: 201, body: JSON.stringify(prize) };
}
