import { DynamoDB, FileSystemCredentials } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

interface MapInfo {
  markers: {
    release: number;
    duration: number;
  }[];
}

const table_name = process.env.TABLE_NAME!;
const doc_client = new DynamoDB.DocumentClient({ region: process.env.REGION, endpoint: process.env.ENDPOINT_OVERRIDE || undefined });

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters) {
    return { statusCode: 400, body: "No path parameters" };
  }

  //Get Map
  const map_name = event.pathParameters.map;
  const key = 'map-' + map_name;
  const map_info_result = await doc_client.get({ TableName: table_name, Key: { id: key } }).promise();
  const map_info = map_info_result.Item as MapInfo;

  //Map Check
  if (!map_info) {
    return { statusCode: 404, body: 'Map not found' }
  }

  //Filter Map Info to currently open and time to next.
  const time = Date.now() / 1000;
  // Allow elements that either do not have a release time (considered timeless) or whose life time covers the current date.
  // Elements with a release time and no duration are assumed to be available forever after release
  const markers = map_info.markers.filter(({ release, duration }) =>
    !release || (release < time && (!duration || release + duration > time)));

  const next_release = Math.min(...map_info.markers.filter(({ release }) => release > time) //Filters to future objects
                                                   .map(({ release }) => release) //Converts objects into just release time
                                                   .filter(release => !!release)); //Removes null
  const return_data = {
    markers: markers,
    next_release: next_release
  };

  return { statusCode: 200, body: JSON.stringify(return_data) };
}
