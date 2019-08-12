# Compile code
# TODO: Should be able to run tsc from root to compile
cd lambda
tsc
cd ..

docker network create lambda-local

# Note: If at this point you get a 'Error response from daemon: driver failed programming external connectivity on endpoint dynamodb', first try restarting docker
docker run --detach -p 8000:8000 --network lambda-local --name dynamodb amazon/dynamodb-local -jar DynamoDBLocal.jar -inMemory -sharedDb
aws dynamodb create-table --table-name AdventureApp --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=2,WriteCapacityUnits=1 --endpoint-url http://localhost:8000
aws dynamodb create-table --table-name AdventureAppPrizes --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=2,WriteCapacityUnits=1 --endpoint-url http://localhost:8000
aws dynamodb create-table --table-name AdventureAppUsers --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=2,WriteCapacityUnits=1 --endpoint-url http://localhost:8000
aws dynamodb create-table --table-name AdventureAppTelemetry --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=10 --endpoint-url http://localhost:8000

ts-node ./dynamodb/adventure-app/write.ts --db http://localhost:8000

sam local start-api --profile shwoop --env-vars ./local-env.json --docker-network lambda-local
