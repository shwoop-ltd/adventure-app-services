import { Persistence } from '../../../core/persistence';

export interface ApiResponse {
  code: number;
  body: string | object | boolean;
}

export interface ApiRequest {
  path: { [key: string]: string | undefined };
  query: { [key: string]: string[] | string | undefined };
  headers: { [key: string]: string };
  body: string | null; // TODO: Should allow json content
  authorizer: undefined | null | { claims: { sub?: string } };
}

export type ApiFunction = (event: ApiRequest, database: Persistence) => Promise<ApiResponse>;
