import {Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {
    ProviderAttribute,
    UserPool,
    UserPoolClient,
    UserPoolClientIdentityProvider,
    UserPoolIdentityProviderGoogle,
} from "aws-cdk-lib/aws-cognito";
import {Construct} from "constructs";
import {AuthorizationType, CognitoUserPoolsAuthorizer, LambdaIntegration, RestApi,} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {PolicyStatement,} from "aws-cdk-lib/aws-iam";
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId,} from "aws-cdk-lib/custom-resources";
import {BackendAPI} from "./api/BackendAPI/BackendAPI";
import {CustomUserPoolClient} from "./api/CustomUserPoolClient";
import {PublicEndpoint} from "./api/PublicEndpoint/PublicEndpoint";

export class AwsCdkCognitoTestStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Used as a prefix for the Cognito pool domain name as well as some internal SSM Parameter Store parameters
        // Must be globally unique (Cognito limitation) across all AWS accounts (like S3 bucket names)
        const uniquePrefix = "test-2022";

        const userPool = new UserPool(this, "UserPool", {
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const userPoolDomain = userPool.addDomain("default", {
            cognitoDomain: {
                domainPrefix: uniquePrefix,
            },
        });

        new UserPoolIdentityProviderGoogle(this, "Google", {
            userPool,
            clientId: "727537661772-gvsqml5fj15odn7i9ut3q0std5a9fko2.apps.googleusercontent.com",
            clientSecret: "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",

            // Email scope is required, because the default is 'profile' and that doesn't allow Cognito
            // to fetch the user's email from his Google account after the user does an SSO with Google
            scopes: ["email"],

            attributeMapping: {
                email: ProviderAttribute.GOOGLE_EMAIL,
            },
        });

        const backend = new BackendAPI(this, 'Backend', {
            uniquePrefix,
            userPool,
        });

        new PublicEndpoint(this, 'PublicEndpoint', {
            restApi: backend.api,
        });

        const client = new CustomUserPoolClient(this, "UserPoolClient", {
            userPool,
            supportedIdentityProviders: [UserPoolClientIdentityProvider.GOOGLE],
            oAuth: {
                callbackUrls: [backend.api.urlForPath("/public")],
            },
        });

        new StringParameter(this, "UserPoolClientId", {
            parameterName: `/${uniquePrefix}/userpool/client_id`,
            stringValue: client.userPoolClientId,
        });
        new StringParameter(this, "UserPoolClientSecret", {
            parameterName: `/${uniquePrefix}/userpool/client_secret`,
            stringValue: client.userPoolClientSecret
        });
        new StringParameter(this, "UserPoolDomainPrefix", {
            parameterName: `/${uniquePrefix}/userpool/domain_prefix`,
            stringValue: userPoolDomain.domainName,
        });
        new StringParameter(this, "UserPoolRegion", {
            parameterName: `/${uniquePrefix}/userpool/region`,
            stringValue: Stack.of(userPool).region,
        });
        new StringParameter(this, "UserPoolClientCallbackURL", {
            parameterName: `/${uniquePrefix}/userpool/callback-url`,
            stringValue: backend.api.urlForPath("/public"),
        });
    }
}
