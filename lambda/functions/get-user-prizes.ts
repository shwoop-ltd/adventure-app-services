import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const users_table_name = process.env.USERS_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    if (!event.queryStringParameters || !event.queryStringParameters.id)
        return { statusCode: 400, body: "User ID was not present" };

    const result = await doc_client.get({ TableName: users_table_name, Key: { "id": event.queryStringParameters.id } }).promise();

    if (result.Item)
        return {
            statusCode: 200,
            body: JSON.stringify({"points": result.Item.points, "prizes": result.Item.prizes}),
        };
    else
        return {
            statusCode: 404,
            body: "User not found!",
        };
}
