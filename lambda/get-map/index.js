const AWS = require('aws-sdk');

const doc_client = new AWS.DynamoDB.DocumentClient({region: 'ap-southeast-2'});

exports.handler = async (event) => {
  const map_name = event.pathParameters.map;

  const result = await doc_client.get({ TableName: 'AdventureApp', Key: { id: map_name } }).promise();

  if(result.Item)
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  else
    return {
      statusCode: 404
    }
};
