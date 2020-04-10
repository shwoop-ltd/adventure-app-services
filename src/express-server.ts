// Note: This is only called if locally starting an express server

import * as express from 'express';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import { ApiRequest, ApiResponse } from './_common/nodejs/controller';

// Determine the paths to the files based on the template.yaml alone.

type Wrapper = (req: express.Request, res: express.Response) => Promise<void>;

async function run() {
  const app = express();
  const bodyParser = require('body-parser');
  app.use(bodyParser.json());

  const template_schema = yaml.Schema.create([
    new yaml.Type('!Ref', { kind: 'scalar' }),
    new yaml.Type('!Sub', { kind: 'scalar' }),
    new yaml.Type('!Join', { kind: 'sequence' }),
  ]);

  const template = yaml.safeLoad(await fs.promises.readFile('template.yaml', 'utf-8'), { schema: template_schema });
  const openapi = yaml.safeLoad(await fs.promises.readFile('resources/openapi.yaml', 'utf-8'), {
    schema: template_schema,
  });

  // Go through each endpoint and verify it. It's not worth it defining the type, as you can look at template.yaml
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Object.entries<any>(template.Resources)
    .filter(([_, entry]) => entry.Type === 'AWS::Serverless::Function')
    .forEach(([name, entry]) => {
      // Path to import from
      const handler_parts: string[] = entry.Properties.Handler.split('.');
      const include_dir = entry.Properties.CodeUri.replace('./build', './') + '/' + handler_parts[0];
      const import_part = handler_parts[1];

      // TODO: If we wanted to be more advanced, we could mock the database security, by ensuring crud access is
      // given in the template.yaml before allowing access to a part of the DB

      const endpoint: string = entry.Properties.Events.Api.Properties.Path;
      const method: string = entry.Properties.Events.Api.Properties.Method;

      // TODO: Confirm the given info exists in the openapi doc too.

      const handler: Wrapper = require(include_dir)[import_part];

      const express_endpoint = endpoint.replace(/{(.*?)}/g, ':$1');

      console.log(
        `Creating endpoint ${name.padEnd(18)} ` +
          `at ${method.padEnd(6)} ${express_endpoint.padEnd(48)}` +
          `-> ${include_dir}:${import_part}`
      );
      // do some magic to allow for a variable method. The as 'put' makes typescript think it's a valid method.
      app.route(express_endpoint)[method.toLowerCase() as 'put']((req, res) => {
        console.log(`${name} called with path parameters ${JSON.stringify(req.params)}`);
        return handler(req, res);
      });
    });

  app.listen(3000, () => console.log('Now listening on port 3000'));
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run();
