/**
 * Writes the given json objects into our table
 */

import * as AWS from 'aws-sdk';

import beacons from './beacons.json';
import marker_sets from './map-info.json';
import maps from './maps.json';
import puzzles from './puzzles.json';

type Item = (typeof beacons | typeof marker_sets | typeof maps | typeof puzzles)[0];

const filter_params = {
  map: undefined as string | undefined,
  beacons: false,
  map_info: false,
  maps: false,
  puzzles: false,
};

function verify_params() {
  const mapIndex = process.argv.indexOf("--map");
  if(mapIndex > 0) {
    if(process.argv.length <= mapIndex + 1) {
      console.log("When passing --map, must specify map name after");
      return false;
    }
    else
      filter_params.map = process.argv[mapIndex + 1];
  }

  if(process.argv.includes('--beacons'))
    filter_params.beacons = true;
  if(process.argv.includes('--map-info'))
    filter_params.map_info = true;
  if(process.argv.includes('--maps'))
    filter_params.maps = true;
  if(process.argv.includes('--puzzles'))
    filter_params.puzzles = true;

  if(!filter_params.beacons && !filter_params.map_info && !filter_params.maps && !filter_params.puzzles) {
    filter_params.beacons = true;
    filter_params.map_info = true;
    filter_params.maps = true;
    filter_params.puzzles = true;
  }

  return true;
}

function filter(item: Item) {
  if(filter_params.map && (item.id !== "maps" && item.id.split('-')[1] !== filter_params.map))
    return false;

  if(item.id.startsWith('beacon') && !filter_params.beacons)
    return false;
  else if(item.id.startsWith('map') && !filter_params.map_info)
    return false;
  else if(item.id.startsWith('puzzle') && !filter_params.puzzles)
    return false;
  else if(item.id === "maps" && !filter_params.maps) // If it doesnt start with anything, it must be the map itself. TODO: Should we not??
    return false;

  return true;
}

async function run() {
  if(!verify_params())
    return;

  // TODO: Currently no method to remove items in the database, only overwrite or add

  // Setup creds
  AWS.config.credentials = new AWS.SharedIniFileCredentials({ profile: 'shwoop' });
  const doc_client = new AWS.DynamoDB.DocumentClient({ region: 'ap-southeast-2' });

  const items = [
    ...marker_sets,
    ...maps,
    ...puzzles,
    ...beacons,
  ];

  const items_to_change = items.filter(filter);

  console.log("Modifying " + items_to_change.length + " items");

  const result = await doc_client.batchWrite({
    RequestItems: {
      AdventureApp: items_to_change.map(item => ({ PutRequest: { Item: item } })),
    },
  }).promise();

  console.log(result);
}

run().catch(e => console.error(e));
