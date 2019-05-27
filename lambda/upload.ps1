$func = $args[0]
$scriptDir = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent

if(!$args.Contains("--no-compile")) {
  tsc --p $scriptDir
}

mkdir -Path $scriptDir/.pack -Force
Copy-Item -Path $scriptDir/.build/${func}.js -Destination $scriptDir/.pack/index.js -Force
Compress-Archive -Path $scriptDir/.pack/index.js -DestinationPath $scriptDir/.pack/$func -Force
aws lambda update-function-code --function-name $func --zip-file fileb://$scriptDir/.pack/$func.zip
