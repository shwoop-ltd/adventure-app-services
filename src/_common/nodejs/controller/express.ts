import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { ApiFunction, ApiRequest } from './types';
import Persistence from '../persistence';
import MemoryDriver from '../persistence/drivers/memory';

export default (handler_function: ApiFunction) => async (req: Request, res: Response): Promise<void> => {
  let authorizer = undefined;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const jwt_string = req.headers.authorization.replace(/^Bearer /, '');
    const token = jwt.decode(jwt_string);

    console.log('Authorization token found:');
    console.log(token);

    if (!token || typeof token !== 'object' || !('claims' in token)) {
      console.log('token is not valid, must resemble { ... "claims": { "sub": ... }, ... }');
    } else {
      authorizer = token as { claims: { sub?: string } };
    }
  }

  const input_event: ApiRequest = {
    path: req.params,
    query: req.query,
    body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    headers: req.headers as never,
    authorizer: authorizer,
  };

  const model = new Persistence(input_event, new MemoryDriver());
  const response = await handler_function(input_event, model);
  res.status(response.code).send(response.body);
};
