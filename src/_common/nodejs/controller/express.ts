import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { ApiFunction, ApiRequest } from './types';
import Persistence from '../persistence';
import MemoryDriver from '../persistence/drivers/memory';

export default (handler_function: ApiFunction) => async (req: Request, res: Response): Promise<void> => {
  const input_event: ApiRequest = {
    path: req.params,
    query: req.query,
    body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    headers: req.headers as never,
    authorizer: req.headers.authorization
      ? (jwt.decode(req.headers.authorization) as { claims: { sub?: string } })
      : undefined,
  };

  const model = new Persistence(input_event, new MemoryDriver());
  const response = await handler_function(input_event, model);
  res.status(response.code).send(response.body);
};
