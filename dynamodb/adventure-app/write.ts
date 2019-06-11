/**
 * Writes the given json objects into our table
 */

import * as AWS from 'aws-sdk';

import beacons from './beacons.json';
import marker_sets from './map-info.json';
import maps from './maps.json';
import puzzles from './puzzles.json';

// Setup creds
AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'shwoop' });
const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

async function run() {
  if(process.argv.includes('--clear')) {} // TODO:

  // TODO: Group into one call
  const items = [
    ...marker_sets,
    ...maps,
    ...puzzles,
    ...beacons,
  ];

  const result = await doc_client.batchWrite({
    RequestItems: {
      AdventureApp: items.map(item => ({ PutRequest: { Item: item } })),
    },
  }).promise();
  console.log(result);
}

run().catch(e => console.error(e));
