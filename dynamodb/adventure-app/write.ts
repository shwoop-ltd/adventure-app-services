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

let filter = "";
const mapIndex = process.argv.indexOf("--map");
if(mapIndex > 0) {
  if(process.argv.length <= mapIndex + 1) {
    console.log("When passing --map, must specify map name after");
    process.exit(-1);
  }

  filter = process.argv[mapIndex + 1];
}

async function run() {
  if(process.argv.includes('--clear')) {} // TODO:

  const items = [
    ...marker_sets,
    ...maps,
    ...puzzles,
    ...beacons,
  ];

  const result = await doc_client.batchWrite({
    RequestItems: {
      AdventureApp: items.filter(item => item.id.includes(filter)).map(item => ({ PutRequest: { Item: item } })),
    },
  }).promise();

  console.log(result);
}

run().catch(e => console.error(e));
