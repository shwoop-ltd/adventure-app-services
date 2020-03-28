/**
 * Writes the given json objects into our table
 */
import * as AWS from 'aws-sdk';
import { ScanOutput, ScanInput } from 'aws-sdk/clients/dynamodb';

const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

const params: ScanInput = {
  TableName: 'AdventureAppTelemetry-Prod',
  FilterExpression: '#t > :time',
  ExpressionAttributeNames: {
    '#t': 'date',
  },
  ExpressionAttributeValues: {
    ':time': 1571000400,
  },
};

function onScan(err: AWS.AWSError, data: ScanOutput) {
  if(err)
    console.error('Unable to scan the table. Error JSON:', JSON.stringify(err, null, 2));
  else {
    // print all the movies
    console.log('Scan succeeded.');
    if(!data.Items) {
      console.log('No items match filter.');
      return;
    }
    let i = 0;
    [...new Set(data.Items.map((e) => e.user_id))].forEach((user_id) => {
      console.log(user_id);
      let update_params = {
        TableName: 'AdventureAppUsers-Prod',
        Key: { id: user_id },
        UpdateExpression: 'set #b = :b',
        ExpressionAttributeNames: { '#b': 'beta' },
        ExpressionAttributeValues: {
          ':b': false,
        },
      };

      if(i % 2 === 0) {
        update_params = {
          TableName: 'AdventureAppUsers-Prod',
          Key: { id: user_id },
          UpdateExpression: 'set #b = :b',
          ExpressionAttributeNames: { '#b': 'beta' },
          ExpressionAttributeValues: {
            ':b': true,
          },
        };
      }

      doc_client.update(update_params, (err2, data2) => {
        if(err2)
          console.log(err2);
        else
          console.log(data2);
      });
      i += 1;
    });
    console.log('All users listed.');
    // continue scanning if we have more movies, because
    // scan can retrieve a maximum of 1MB of data
    if(typeof data.LastEvaluatedKey !== 'undefined') {
      console.log('Scanning for more...');
      params.ExclusiveStartKey = data.LastEvaluatedKey;
      doc_client.scan(params, onScan);
    }
  }
}

// TODO: Currently no method to remove items in the database, only overwrite or add
async function run() {
  // Load db from input files

  // Setup creds
  await doc_client.scan(params, onScan).promise();
}

run().catch((e) => console.error(e));
