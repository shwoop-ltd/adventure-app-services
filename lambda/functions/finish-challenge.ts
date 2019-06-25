import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const doc_client = new DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  // TODO: Get info about user, store user info

  if(!event.pathParameters)
    return { statusCode: 400, body: "No path parameters" };
  if(!event.queryStringParameters || (!event.queryStringParameters.challenge && !event.queryStringParameters.beacon))
    return { statusCode: 400, body: "Challenge ID was not present" };

  const challenge_id = event.queryStringParameters.challenge;
  const key = challenge_id;

  const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: key } }).promise();

  if(!result.Item)
    return { statusCode: 404, body: `There is no challenge with an id of ${challenge_id}` };

  try {
    if(!event.body)
      throw new Error();

    const body = JSON.parse(event.body);

    if(result.Item.solution === body.beacon_id) // Correct, they get a prize. TODO: Actual prize stuff
      return { statusCode: 200, body: JSON.stringify({ type: 'red-bull' }) };
    else // Not correct, so no prize
      return { statusCode: 204, body: `Beacon ${body.beacon_id} is not the correct answer for this challenge!` };
  }
  catch(e) {
    // Some problem with decoding information
    return { statusCode: 400, body: JSON.stringify(e) };
  }
}
