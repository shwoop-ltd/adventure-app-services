import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const table_name = process.env.TABLE_NAME!;
const users_table_name = process.env.USERS_TABLE_NAME!;
const prizes_table_name = process.env.PRIZES_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

function generateRandomString(length: number) {
  let returnString = ""
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  for (let i = 0; i < length; i++) {
    returnString += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return returnString;
}

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters || !event.pathParameters.userid) {
    return { statusCode: 400, body: "Missing path parameters." }
  }
  if (!event.body) {
    return { statusCode: 400, body: "Body not present" }
  }

  const body = JSON.parse(event.body);

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
    id: user_id + "-finishsurvey-" + telemetry_date.toISOString(),
    pathParameters: event.pathParameters,
    body: event.body,
    queryStringParameters: event.queryStringParameters,
    headers: event.headers
  }
  doc_client.put({ TableName: telemetry_table_name, Item: telemetry_data });
  const survey_questions_result = await doc_client.get({ TableName: table_name, Key: { "id": "survey-questions" } }).promise();
  const survey_questions = survey_questions_result.Item;
  if (!survey_questions) {
    return { statusCode: 502, body: "Could not find survey" };
  }
  const user_answered_questions = user.surveys.map(((x: { question: string; }) => x.question ));
  const question_objects = survey_questions.questions.filter((element: { question: string; }) => !user_answered_questions.includes(element.question));
  const question_questions = question_objects.map((x: { question: string; }) => x.question);

  if (!question_questions.includes(body.question)) {
    return { statusCode: 404, body: "Question already completed or no question found." }
  }

  const survey = {
    question: body.question,
    answers: body.answers,
    answer: body.answer
  };

  user.surveys.push(survey)
  var surveys_params = {
    TableName: users_table_name,
    Key: { "id": user_id },
    UpdateExpression: 'SET surveys = :x',
    ExpressionAttributeValues: {
      ':x': user.surveys
    }
  };

  doc_client.update(surveys_params, err => {});

  const d = new Date();
  const prize = {
    id: generateRandomString(8),
    type: "red-bull",
    received: d.toISOString(),
    received_from: "challenge",
    claimed: false,
    user_id: user_id
  };

  //Set up updating user's prizes
  user.prizes.push(prize.id);
  var prizes_params = {
    TableName: users_table_name,
    Key: { "id": user_id },
    UpdateExpression: 'SET prizes = :x',
    ExpressionAttributeValues: {
      ':x': user.prizes
    }
  };

  doc_client.update(prizes_params, function (err, data) { if (err) return { statusCode: 418, body: err } });

  //Store prize in prize table
  doc_client.put({ TableName: prizes_table_name, Item: prize }, function (err, data) { });

  return { statusCode: 200, body: JSON.stringify(prize) };
}


