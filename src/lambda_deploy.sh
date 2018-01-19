#!/usr/bin/env bash

rm -rf lambda_upload.zip
zip -r lambda_upload.zip index.js
$(which aws) --profile=bhegazy lambda update-function-code --function-name GreetingSkill --zip-file fileb://lambda_upload.zip