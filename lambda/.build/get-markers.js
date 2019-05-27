"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const doc_client = new aws_sdk_1.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });
exports.default = async (event, context) => {
    const map_name = event.pathParameters.map;
    const key = 'markers-' + map_name;
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
