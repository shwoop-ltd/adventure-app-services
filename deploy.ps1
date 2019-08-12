sam validate

# Compile code
# TODO: Should be able to run tsc from root to compile
cd lambda
tsc
cd ..

sam package --template-file template.yaml --s3-bucket adventure-app-cloudformation --output-template-file cloudformation.yaml
sam deploy --template-file ./cloudformation.yaml --stack-name adventure-app --capabilities CAPABILITY_IAM
