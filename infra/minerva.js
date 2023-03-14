#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { MinervaStack } = require('./minerva-stack');

const app = new cdk.App();

new MinervaStack(app, "minerva-dev", {
  stackName: "minerva-dev",
  description: "Development Serverless Deployment for Minerva",
  deployEnv: "development",
  env: { account: '529410955324', region: 'us-east-1'}
});

new MinervaStack(app, 'minerva-prod', {
  stackName: "minerva-prod",
  description: "Production Serverless Deployment for Minerva",
  deployEnv: "production",
  env: { account: '529410955324', region: 'us-east-2'},
});