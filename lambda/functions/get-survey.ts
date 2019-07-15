import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

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
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters || !event.pathParameters.userid) {
    return { statusCode: 400, body: "Missing path parameters." };
  }

  // Get the user, as we need to find a survey the user has yet to answer
  const user_id = event.pathParameters.userid;
  const user_result = await doc_client.get({ TableName: users_table_name, Key: { id: user_id } }).promise();
  if (!user_result.Item) {
    return { statusCode: 401, body: "User does not exist." };
  }
  const answered_questions = (user_result.Item.surveys as CompletedSurvey[]).map(({ question }) => question);

  const survey_result = await doc_client.get({ TableName: table_name, Key: { id: "surveys" } }).promise();
  if (!survey_result.Item) {
    return { statusCode: 502, body: "Could not find survey" };
  }
  let surveys = survey_result.Item.surveys as Survey[];

  // Remove surveys that the user has answered
  surveys = surveys.filter(({ question }) => !answered_questions.includes(question));

  if(surveys.length === 0)
    return { statusCode: 204, body: "" };
  else
    return { statusCode: 200, body: JSON.stringify(surveys[0]) };
}
