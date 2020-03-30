# Shwoop Adventure App Backend

The shwoop backend is comprised of two different components:

- The database, stored entirely in DynamoDB across a few different tables
- The Api, defined by an [OpenApi schema](./resources/openapi.yaml), and deployed on AWS Api Gateway, routed to AWS Lambda functions

The deployment of these resources is defined by an AWS SAM template, in `template.yaml`.

There are two different deployments: **Development** and **Production**, their purposes you can guess.

## Gettings started

Get set up with `yarn`, which is now the only necessary dependency (apart from git of course). Also consider installing
[AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) on your computer,
permissions can be retrieved from a lead developer (you don't need to set up your own account).

If you want to be able to test locally with SAM (not a necessity), also install docker, but otherwise do not worry about this.

### Running locally with SAM

You can then run locally with `./scripts/start-sam.ps1`.
Scripts for non-windows OSes aren't present but should be similar if not identical to existing ones.
Once you exit, remember to run `./scripts/stop.ps1` to cleanup all resources.
The local instance contains all endpoints and all databases, with data in the main database populated from `./resouces/dev`.
Other tables will be present but empty.

### Running locally with Express

If you can't get SAM to run, you can use Express instead via `yarn start-express`.
Please note that express will not be as good at emulating the production backend as SAM is,
but can still suffice in some circumstances.
Like with SAM, the main database is populated and all endpoints are present, but this server will run much faster.
HOWEVER, endpoints requiring authentication will currently be unsuccessful due to mocking auth limitations.

### Deploying to AWS

To deploy, first setup your aws keys.
Ask a lead to get your deployment keys,
and set them up in your [aws credentials file](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html),
e.g. with the name `shwoop`. Then you can run `./scripts/deploy.ps1 Development --profile shwoop`.

## Repository Structure

Information about some of the database schemas are stored in [the resources folder](./resources/adventure-app.schema.json).
Additionally that folder contains some development and production data used in development and production.
`data-science` contains some old scripts used for collecting information about usage post-campaign.
All lambda's are stored in the `src` folder, and get built to `build` when being deployed.
Integration and functional tests are stored in `tests`.

## Tooling and Workflows

See the [front end’s README](https://bitbucket.org/shwoopdevelopment/adventure-app/src/master/README.md#markdown-header-tooling-and-workflows).
