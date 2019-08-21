import { APIGatewayProxyResult } from 'aws-lambda';
import { AdventureApp, response } from '/opt/nodejs';

export async function handler(): Promise<APIGatewayProxyResult> {
  const maps = await AdventureApp.get_maps();

  if(maps)
    return response(200, maps.maps);
  else
    return response(500, "Maps not found!");
}
