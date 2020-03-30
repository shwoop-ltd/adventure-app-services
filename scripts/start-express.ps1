$env:IN_MEMORY_SEED_PATH = './resources/dev/AdventureApp.json';
$env:LOCAL_EXPRESS = 'TRUE';
yarn ts-node -P .\tsconfig.json -r tsconfig-paths/register .\src\express-server.ts
