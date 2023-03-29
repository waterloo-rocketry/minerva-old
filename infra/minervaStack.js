const cdk = require( 'aws-cdk-lib' );
const apiGateway = require( 'aws-cdk-lib/aws-apigateway' );
const iam = require( 'aws-cdk-lib/aws-iam' );
const logs = require( 'aws-cdk-lib/aws-logs' );
const lambda = require( 'aws-cdk-lib/aws-lambda' );
const awsEvents = require( 'aws-cdk-lib/aws-events' );
const awsEventsTargets = require( 'aws-cdk-lib/aws-events-targets' );
const ssm = require( 'aws-cdk-lib/aws-ssm' );
const { NodejsFunction } = require('aws-cdk-lib/aws-lambda-nodejs');

const path = require('path');

class MinervaStack extends cdk.Stack {
    /**
     *
     * @param {Construct} scope
     * @param {string} id
     * @param {StackProps=} props
     */
    constructor ( scope, id, props ) {
        super( scope, id, props );

        const { deployEnv } = props

        // https://docs.aws.amazon.com/secretsmanager/latest/userguide/retrieving-secrets_lambda.html#retrieving-secrets_lambda_ARNs
        const awsSecretsExtensionArn = {
            development: "arn:aws:lambda:us-east-1:177933569100:layer:AWS-Parameters-and-Secrets-Lambda-Extension:4",
            production: "arn:aws:lambda:us-east-2:590474943231:layer:AWS-Parameters-and-Secrets-Lambda-Extension:4",
        }

        // Default configuration for Lambda functions
        const lambdaFnProps = {
            runtime: lambda.Runtime.NODEJS_16_X,
            timeout: cdk.Duration.seconds( 100 ),
            memorySize: 128,
            entry: path.join(__dirname, '../src/index.js'),
            logRetention: logs.RetentionDays.ONE_MONTH,
            layers: [
                lambda.LayerVersion.fromLayerVersionArn( this, 'AWS-Parameters-and-Secrets-Lambda-Extension', awsSecretsExtensionArn[ deployEnv ] ),
            ],
            environment: {
                NODE_ENV: deployEnv,
                googleaccount_redirect: "https://developers.google.com/oauthplayground/",
                // These env vars do not contain the secrets themselves, but rather the names of the SSM parameters that contain the secrets
                slack_token: "/minerva/slack_token",
                googleaccount_client: "/minerva/googleaccount_client",
                googleaccount_secret: "/minerva/googleaccount_secret",
                googleaccount_token: "/minerva/googleaccount_token",
                secrets_extension_http_port : "2773"
            },
            bundling: {
                target: 'es2020',
                minify: false,
                sourcemaps: false,
            }
        }

        // Create a policy that allows lambda functions to get parameters from SSM and decrypt them
        const ssmSecretsPolicy = new iam.PolicyDocument({
            statements: [new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    'ssm:GetParameter',
                    'kms:Decrypt',
                ],
                resources: [
                    'arn:aws:ssm:*:*:parameter/*',
                    'arn:aws:kms:*:*:key/*',
                ],
            })]
        })
        
        // Create a role for Lambda functions that need to execute other Lambda functions
        const lambdaWithExecuteRole = new iam.Role( this, 'LambdaWithExecuteRole', {
            assumedBy: new iam.ServicePrincipal( "lambda.amazonaws.com" ),
            inlinePolicies: {
                ssmSecretsPolicy: ssmSecretsPolicy,
            },
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName( 'service-role/AWSLambdaBasicExecutionRole' ),
                iam.ManagedPolicy.fromAwsManagedPolicyName( 'service-role/AWSLambdaRole' ),
            ],
        } )

        // Create a basic role for Lambda functions
        const lambdaRole = new iam.Role( this, 'LambdaRole', {
            assumedBy: new iam.ServicePrincipal( 'lambda.amazonaws.com' ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName( 'service-role/AWSLambdaBasicExecutionRole' ),
                ssmSecretsPolicy
            ],
        } )

        // Create Lambda functions
        const slackCommandsSync = new NodejsFunction( this, 'SlackCommandsSync', {
            ...lambdaFnProps,
            handler: 'index.slack_commands_sync',
            functionName: `minerva-${ deployEnv }-slackCommandsSync`,
            role: lambdaWithExecuteRole,
        } );

        const slackCommandsAsync = new NodejsFunction( this, 'SlackCommandsAsync', {
            ...lambdaFnProps,
            handler: 'index.slack_commands_async',
            functionName: `minerva-${ deployEnv }-slackCommandsAsync`,
            role: lambdaRole,
        } );

        const interactivitySync = new NodejsFunction( this, 'InteractivitySync', {
            ...lambdaFnProps,
            handler: 'index.interactivity_sync',
            functionName: `minerva-${ deployEnv }-interactivitySync`,
            role: lambdaWithExecuteRole,
        } );

        const interactivityAsync = new NodejsFunction( this, 'InteractivityAsync', {
            ...lambdaFnProps,
            handler: 'index.interactivity_async',
            functionName: `minerva-${ deployEnv }-interactivityAsync`,
            role: lambdaRole,
        } );

        const scheduled = new NodejsFunction( this, 'Scheduled', {
            ...lambdaFnProps,
            handler: 'index.scheduled',
            functionName: `minerva-${ deployEnv }-scheduled`,
            role: lambdaWithExecuteRole,
        });

        // Create API Gateway
        const minervaApi = new apiGateway.RestApi( this, 'MinervaApi', {
            deployOptions: {stageName: deployEnv},
        } )

        // All Slack lambda functions are under the same "slack" route
        const slackRoute = minervaApi.root.addResource('slack');
        // Attach the Lambda functions to the Slack route
        slackRoute.addResource('commands-sync').addMethod('POST', new apiGateway.LambdaIntegration(slackCommandsSync));
        slackRoute.addResource('commands-async').addMethod('POST', new apiGateway.LambdaIntegration(slackCommandsAsync));
        slackRoute.addResource('interactivity-sync').addMethod('POST', new apiGateway.LambdaIntegration(interactivitySync));
        slackRoute.addResource('interactivity-async').addMethod('POST', new apiGateway.LambdaIntegration(interactivityAsync));
        slackRoute.addResource('scheduled').addMethod('POST', new apiGateway.LambdaIntegration(scheduled));

        // Create an EventBridge rule to trigger the lambda functions every minute, keeping the lambda functions warm
        const keepLambdaWarmRule = new awsEvents.Rule( this, 'KeepLambdaWarmRule', {
            schedule: awsEvents.Schedule.rate( cdk.Duration.minutes( 1 ) ),
            targets: [
                new awsEventsTargets.LambdaFunction( slackCommandsSync ),
                new awsEventsTargets.LambdaFunction( slackCommandsAsync ),
                new awsEventsTargets.LambdaFunction( interactivitySync ),
                new awsEventsTargets.LambdaFunction( interactivityAsync ),
                new awsEventsTargets.LambdaFunction( scheduled ),
            ],
        } );
    }
}

module.exports = { MinervaStack }

