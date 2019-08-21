import { APIGatewayProxyResult } from 'aws-lambda';
import { AdventureApp, response } from '/opt/nodejs';

export async function handler(): Promise<APIGatewayProxyResult> {
  const result = await AdventureApp.get_prize_types();

  if(result)
    return response(200, result.prizes);
  else
    return response(502, "No prize types!");
}
