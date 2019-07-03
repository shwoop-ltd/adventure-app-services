sam validate

# Compile code
# TODO: Should be able to run tsc from root to compile
cd lambda
tsc
cd ..

# Pre-upload the openapi.yaml so it is accessible for sam
aws s3 cp ./api-gateway/openapi.yaml s3://adventure-app-cloudformation/

sam package --template-file template.yaml --s3-bucket adventure-app-cloudformation --output-template-file cloudformation.yaml
sam deploy --template-file ./cloudformation.yaml --stack-name shwoop --capabilities CAPABILITY_IAM
