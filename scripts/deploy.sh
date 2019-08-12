sam validate

# Compile code
tsc -p ./lambda

sam package --template-file template.yaml --s3-bucket adventure-app-cloudformation --output-template-file cloudformation.yaml
sam deploy --template-file ./cloudformation.yaml --stack-name adventure-app --capabilities CAPABILITY_IAM
