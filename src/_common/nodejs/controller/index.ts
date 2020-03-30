import { ApiFunction } from './types';
export { ApiResponse, ApiRequest } from './types';

const controller = (handler_function: ApiFunction) => async (...input: never[]) => {
  let child_controller: (func: ApiFunction) => (...input: never[]) => Promise<unknown>;
  if (process.env.LOCAL_EXPRESS) {
    child_controller = (await import('./express')).default;
  } else {
    child_controller = (await import('./aws')).default;
  }

  return child_controller(handler_function)(...input);
};

export default controller;
