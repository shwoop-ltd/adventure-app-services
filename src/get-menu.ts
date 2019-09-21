import { APIGatewayProxyResult } from 'aws-lambda';
import { AdventureApp, response } from '/opt/nodejs';

export async function handler(): Promise<APIGatewayProxyResult> {
    const menu = await AdventureApp.get_menu();

    if (menu)
        return response(200, menu.items);
    else
        return response(500, "Menu not found!");
}
