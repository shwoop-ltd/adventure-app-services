sam validate --profile shwoop

sam package --template-file template.yaml --s3-bucket shwoop-cloudformation --output-template-file cloudformation.yaml --profile shwoop
sam deploy --template-file ./cloudformation.yaml --stack-name shwoop --capabilities CAPABILITY_IAM --profile shwoop
