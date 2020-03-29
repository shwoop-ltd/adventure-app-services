import { APIGatewayProxyResult } from 'aws-lambda'
import { DBPrize, Location } from 'schemas'

interface PrizeResponse {
  id: string
  location: Location
  type: string
  received_from: string
  received: string
  redeemed: boolean
  points?: number
}

export function create_prize_response(prize: DBPrize): PrizeResponse {
  // eslint-disable-next-line
  const { user_id, ...rest } = prize
  return rest
}
export function create_points_prize_response(
  points: number,
  location: Location,
  received_from: 'survey' | 'challenge' | 'treasure'
): PrizeResponse {
  return {
    id: 'points',
    type: 'points',
    location,
    received_from,
    received: new Date().toISOString(),
    redeemed: true,
    points
  }
}

export function response(code: number, body: string | object | boolean): APIGatewayProxyResult {
  if (typeof body === 'string') {
    return {
      statusCode: code,
      body,
      headers: { 'Content-Type': 'text/plain' }
    }
  } else {
    return {
      statusCode: code,
      body: JSON.stringify(body)
    }
  }
}
