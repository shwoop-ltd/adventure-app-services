import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters || !event.pathParameters.userid) {
    return { statusCode: 400, body: "Missing path parameters." }
  }

  const user_id = event.pathParameters.userid;
  //Does this user exist?
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { "id": user_id } }).promise();
  const user = user_result.Item;
  if (!user) {
    return { statusCode: 401, body: "User does not exist." }
  }

  const telemetry_table_name = process.env.TELEMETRY_TABLE_NAME!;
  const telemetry_date = new Date()
  const telemetry_data = {
    id: user_id + "-gettreasure-" + telemetry_date.toISOString(),
    pathParameters: event.pathParameters,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers
  }
  const survey_questions_result = await doc_client.get({ TableName: table_name, Key: { "id": "survey-questions" } }).promise();
  const survey_questions = survey_questions_result.Item;
  if (!survey_questions) {
    return { statusCode: 502, body: "Could not find survey" };
  }

  const questions = survey_questions.questions.filter((element: { question: string; }) => !(user.surveys.map((x: { question: string; }) => x.question).includes(element.question)));

  const question = questions[0];

  return { statusCode: 200, body: JSON.stringify(question) }
}


