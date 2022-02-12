#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import {CognitoGoogleFederationExperiment} from "../lib/CognitoGoogleFederationExperiment";

const app = new cdk.App();
new CognitoGoogleFederationExperiment(app, "AwsCdkCognitoTestStack", {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
    },
});
