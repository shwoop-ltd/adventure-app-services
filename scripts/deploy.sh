sam validate "${@:2}"

# Compile code
tsc

sam package --template-file template.yaml --s3-bucket adventure-app-cloudformation --s3-prefix $1 --output-template-file cloudformation.yaml "${@:2}"
sam deploy --template-file ./cloudformation.yaml --stack-name AdventureApp$1 --capabilities CAPABILITY_IAM "${@:2}"
