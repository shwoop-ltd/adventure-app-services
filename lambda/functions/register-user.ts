import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const users_table_name = process.env.USERS_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    if (!event.pathParameters || !event.pathParameters.userid) {
        return { statusCode: 400, body: "No userid" }
    }

    const user_id = event.pathParameters.userid;

    const telemetry_table_name = process.env.TELEMETRY_TABLE_NAME!;
    const telemetry_date = new Date()
    const telemetry_data = {
      id: user_id + "-registeruser-" + telemetry_date.toISOString(),
      pathParameters: event.pathParameters,
      body: event.body,
      queryStringParameters: event.queryStringParameters,
      headers: event.headers
    }
    doc_client.put({TableName: telemetry_table_name, Item: telemetry_data});
    //Does this user exist already?
    const user_result = await doc_client.get({ TableName: users_table_name, Key: { "id": user_id } }).promise();
    var user = user_result.Item;
    if (user) {
        return { statusCode: 409, body: "Conflict. Account already exists." };
    }
    user = {
        id: user_id,
        points: 0,
        surveys: [],
        prizes: [],
        treasure: []
    };
    await doc_client.put({ TableName: users_table_name, Item: user }, function (err, data) { if (err) { return { statusCode: 502, body: "Internal server error." } } });
    return { statusCode: 201, body: "Account created." };
}