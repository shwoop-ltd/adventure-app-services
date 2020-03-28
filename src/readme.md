# Src

This folder contains all of the lambdas for the api. Due to AWS SAM limitations, each api function must be in its own folder.

Additionally, there are two special folders:

- `_common` contains code used by multiple lambdas and gets packaged into it's own `layer`.
  Due to the way AWS Lambdas work, code in here must be referenced via `/opt/nodejs/` as that is where it is eventually stored.
- `_schemas` contains TYPES ONLY, meaning it doesn't get compiled.
