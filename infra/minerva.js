#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { MinervaStack } = require('./minervaStack');

const app = new cdk.App();

// Development Stack
new MinervaStack(app, "minerva-dev", {
  stackName: "minerva-dev",
  description: "Development Serverless Deployment for Minerva",
  deployEnv: "development",
  kmsKeyArn: "arn:aws:kms:us-east-1:529410955324:key/f76dd689-2aad-41ba-b56a-2166a43f9576",
  env: { account: '529410955324', region: 'us-east-1'}
});

// Production Stack
new MinervaStack(app, 'minerva-prod', {
  stackName: "minerva-prod",
  description: "Production Serverless Deployment for Minerva",
  deployEnv: "production",
  kmsKeyArn: "arn:aws:kms:us-east-2:529410955324:key/47198e8d-b801-4ac1-a871-53b6a3a3f6dd",
  env: { account: '529410955324', region: 'us-east-2'},
});