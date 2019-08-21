$stage = $args[0]
$extras = $args | Select-Object -Skip 1

sam validate $extras

tsc

sam package --template-file template.yaml --s3-bucket adventure-app-cloudformation --s3-prefix $stage --output-template-file cloudformation.yaml $extras
sam deploy --template-file ./cloudformation.yaml --stack-name AdventureApp$stage --parameter-overrides Stage=$stage --capabilities CAPABILITY_IAM $extras
