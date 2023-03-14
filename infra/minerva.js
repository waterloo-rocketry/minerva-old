#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { MinervaStack } = require('./minerva-stack');

const app = new cdk.App();

new MinervaStack(app, "minerva-dev", {
  stackName: "minerva-dev",
  deployEnv: "development",
  env: { account: '529410955324', region: 'us-east-1'}
});

new MinervaStack(app, 'minerva-prod', {
  stackName: "minerva-prod",
  deployEnv: "production",
  env: { account: '529410955324', region: 'us-east-2'},
});