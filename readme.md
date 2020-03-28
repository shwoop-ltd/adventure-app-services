# Shwoop Adventure App Backend

The shwoop backend is comprised of two different components:

- The database, stored entirely in DynamoDB across a few different tables
- The Api, defined by an [OpenApi schema](./resources/openapi.yaml), and deployed on AWS Api Gateway, routed to AWS Lambda functions

The deployment of these resources is defined by an AWS SAM template, in `template.yaml`.

There are two different deployments: **Development** and **Production**, their purposes you can guess.

## Gettings started

Install [AWS SAM](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html) on your computer,
and get set up with `yarn`.

You can then run locally with `./scripts/start.ps1`. Once you exit, remember to run `./scripts/stop.ps1` to cleanup all resources.
The local instance contains all endpoints and all databases, with data in the main database populated from `./resouces/dev`.
Other tables will be present but empty.

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
