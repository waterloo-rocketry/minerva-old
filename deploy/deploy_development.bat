@ECHO OFF
ECHO This command requires AWS SAM CLI to be installed on your computer. See: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html.
ECHO.
ECHO This command may take a while to process.
ECHO.
call cd ..
call sam deploy --template development_template.yml --stack-name minerva --no-confirm-changeset
ECHO.
PAUSE