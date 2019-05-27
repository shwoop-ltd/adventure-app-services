$scriptPath = Split-Path -Path $MyInvocation.MyCommand.Definition -Parent
$functions = Get-ChildItem -Path $scriptPath/functions

tsc --p $scriptDir

foreach($function in $functions) {
  & $scriptPath/upload.ps1 $($function -replace ".ts") --no-compile
}
