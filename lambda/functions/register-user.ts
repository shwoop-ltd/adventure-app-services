import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

const users_table_name = process.env.USERS_TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
    if (!event.body) {
        return { statusCode: 400, body: "ID not present" }
    }
    const id = JSON.parse(event.body).id;
    
    const result = await doc_client.get({TableName: users_table_name, Key: {"id": id}}).promise();
    const existingUser = result.Item;

    if (existingUser) {
        return {statusCode: 409, body: "Conflict. Account already exists."};
    } else {
        const newUser = {
            id: id,
            points: 0,
            surveys: [],
            prizes: [],
            treasure: []
        };
        doc_client.put({ TableName: users_table_name, Item: newUser }, function (err, data) {if (err) {return {statusCode: 502, body: "Internal server error."}} });
        return {statusCode: 201, body: "Account created."};
    }
}