import { APIGatewayProxyResult } from "aws-lambda";

export function response(code: number, body: string | object): APIGatewayProxyResult {
  if(typeof body === "string") {
    return {
      statusCode: code,
      body,
      headers: { "Content-Type": "text/plain" },
    };
  }
  else {
    return {
      statusCode: code,
      body: JSON.stringify(body),
    };
  }
}
