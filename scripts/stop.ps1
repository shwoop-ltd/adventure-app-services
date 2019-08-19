docker kill dynamodb
docker rm $(docker ps -aq)

docker network remove lambda-local
