const cdk = require( 'aws-cdk-lib' );
const apigateway = require( 'aws-cdk-lib/aws-apigateway' );
const iam = require( 'aws-cdk-lib/aws-iam' );
const lambda = require( 'aws-cdk-lib/aws-lambda' );
const { ApiEventSource } = require( 'aws-cdk-lib/aws-lambda-event-sources' );


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

        const lambdaFnProps = {
            runtime: lambda.Runtime.NODEJS_16_X,
            timeout: cdk.Duration.seconds( 100 ),
            memorySize: 128,
            code: lambda.Code.fromAsset( "src/" ),
            environment: {
                NODE_ENV: deployEnv,
                googleaccount_redirect: "https://developers.google.com/oauthplayground/",
                slack_token: process.env.slack_token,
                googleaccount_client: process.env.googleaccount_client,
                googleaccount_secret: process.env.googleaccount_secret,
                googleaccount_token: process.env.googleaccount_token,
            },
            bundling: {
                target: 'es2020',
                minify: false,
                sourcemaps: false,
            }
        }

        const lambdaWithExecuteRole = new iam.Role( this, 'LambdaWithExecuteRole', {
            assumedBy: new iam.ServicePrincipal( "lambda.amazonaws.com" ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName( 'service-role/AWSLambdaBasicExecutionRole' ),
                iam.ManagedPolicy.fromAwsManagedPolicyName( 'service-role/AWSLambdaRole' ),
            ],
        } )

        const lambdaRole = new iam.Role( this, 'LambdaRole', {
            assumedBy: new iam.ServicePrincipal( 'lambda.amazonaws.com' ),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName( 'service-role/AWSLambdaBasicExecutionRole' ),
            ],
        } )

        const slackCommandsSync = new lambda.Function( this, 'SlackCommandsSync', {
            ...lambdaFnProps,
            handler: 'index.slack_commands_sync',
            functionName: `minerva-${ deployEnv }-slackCommandsSync`,
            role: lambdaWithExecuteRole,
        } );

        const slackCommandsAsync = new lambda.Function( this, 'SlackCommandsAsync', {
            ...lambdaFnProps,
            handler: 'index.slack_commands_async',
            functionName: `minerva-${ deployEnv }-slackCommandsAsync`,
            role: lambdaRole,
        } );

        const interactivitySync = new lambda.Function( this, 'InteractivitySync', {
            ...lambdaFnProps,
            handler: 'index.interactivity_sync',
            functionName: `minerva-${ deployEnv }-interactivitySync`,
            role: lambdaWithExecuteRole,
        } );

        const interactivityAsync = new lambda.Function( this, 'InteractivityAsync', {
            ...lambdaFnProps,
            handler: 'index.interactivity_async',
            functionName: `minerva-${ deployEnv }-interactivity_async`,
            role: lambdaRole,
        } );

        const scheduled = new lambda.Function( this, 'Scheduled', {
            ...lambdaFnProps,
            handler: 'index.scheduled',
            functionName: `minerva-${ deployEnv }-scheduled`,
            role: lambdaWithExecuteRole,
        });

        const minervaApi = new apigateway.RestApi( this, 'MinervaApi', {
            deployOptions: {stageName: deployEnv},
        } )

        const slackRoute = minervaApi.root.addResource('slack');

        slackRoute.addResource('commands-sync').addMethod('POST', new apigateway.LambdaIntegration(slackCommandsSync));
        slackRoute.addResource('commands-async').addMethod('POST', new apigateway.LambdaIntegration(slackCommandsAsync));
        slackRoute.addResource('interactivity-sync').addMethod('POST', new apigateway.LambdaIntegration(interactivitySync));
        slackRoute.addResource('interactivity-async').addMethod('POST', new apigateway.LambdaIntegration(interactivityAsync));
        slackRoute.addResource('scheduled').addMethod('POST', new apigateway.LambdaIntegration(scheduled));
    }
}

module.exports = { MinervaStack }
