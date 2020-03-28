import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { AdventureApp, response } from '/opt/nodejs'

export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  if (!event.pathParameters) return response(400, 'No path parameters')

  const { map, beacon } = event.pathParameters
  const result = await AdventureApp.get_beacon(map, beacon)

  if (result) return response(200, result)
  else return response(404, `Beacon ${beacon} doesn't exist for map ${map}`)
}
