import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const doc_client = new DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

export default async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // TODO: Get info about user, store user info

  if(!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };
  if(!event.queryStringParameters || !event.queryStringParameters.challenge)
    return { statusCode: 400, body: "Challenge ID was not present" };

  const map_name = event.pathParameters.map;
  const challenge_id = event.queryStringParameters.challenge;
  const key = 'puzzle-' + map_name + '-' + challenge_id;

  const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: key } }).promise();

  if(!result.Item)
    return { statusCode: 404, body: "" };

  try {
    if(!event.body)
      throw new Error();

    const body = JSON.parse(event.body);

    // Correct, they get a prize. TODO: Actual prize stuff
    if(result.Item.solution === body.beacon_id)
      return { statusCode: 201, body: JSON.stringify({ prize: { type: 'points', points: 1 } }) };
    else
      return { statusCode: 204, body: "" }; // Not correct, so no prize
  }
  catch(e) {
    // Some problem with decoding information
    return { statusCode: 400, body: "" };
  }
};
