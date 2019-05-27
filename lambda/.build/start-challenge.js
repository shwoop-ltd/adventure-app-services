"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const doc_client = new aws_sdk_1.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });
exports.default = async (event, context) => {
    // TODO: Get info about user
    const map_name = event.pathParameters.map;
    const beacon_id = event.queryStringParameters.beacon;
    const key = 'puzzle-' + map_name + '-' + beacon_id;
    const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: key } }).promise();
    if (result.Item)
        return {
            statusCode: 200,
            body: JSON.stringify(result.Item),
        };
    else
        return {
            statusCode: 404,
            body: "",
        };
};
