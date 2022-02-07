import {Duration, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {
    ProviderAttribute,
    UserPool,
    UserPoolClient,
    UserPoolClientIdentityProvider,
    UserPoolIdentityProviderGoogle
} from "aws-cdk-lib/aws-cognito";
import {Construct} from "constructs";
import {
    AwsIntegration,
    CognitoUserPoolsAuthorizer,
    HttpIntegration,
    LambdaIntegration,
    RestApi
} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {IRole, PolicyStatement, Role, ServicePrincipal} from "aws-cdk-lib/aws-iam";
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from "aws-cdk-lib/custom-resources";
import {Frontend} from "./Frontend/Frontend";
import {IBucket} from "aws-cdk-lib/aws-s3";

export class AwsCdkCognitoTestStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Used as a prefix for the Cognito pool domain name as well as some internal SSM Parameter Store parameters
        // Must be globally unique (Cognito limitation) across all AWS accounts (like S3 bucket names)
        const uniquePrefix = 'test-2022';

        const userPool = new UserPool(this, "UserPool", {
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const domain = userPool.addDomain('default', {
            cognitoDomain: {
                domainPrefix: uniquePrefix,
            },
        });

        new UserPoolIdentityProviderGoogle(this, 'Google', {
            userPool,

            clientId: '727537661772-gvsqml5fj15odn7i9ut3q0std5a9fko2.apps.googleusercontent.com',
            clientSecret: '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',

            scopes: [
                // Email scope is required, because the default is 'profile' and that doesn't allow Cognito
                // to fetch the user's email from his Google account after the user does an SSO with Google
                'email',
            ],

            attributeMapping: {
                email: ProviderAttribute.GOOGLE_EMAIL,
            },
        });

        const restApi = new RestApi(this, 'RestApi', {
            deployOptions: {
                cacheTtl: Duration.seconds(0),
            },
        });

        const cognitoUserPoolsAuthorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoUserPoolsAuthorizer', {
            cognitoUserPools: [userPool],
            resultsCacheTtl: Duration.seconds(0),
        })

        const callbackUrl = restApi.urlForPath('/public/index.html');

        const client = new UserPoolClient(this, 'UserPoolClient', {
            userPool,
            generateSecret: true,
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.GOOGLE,
            ],
            oAuth: {
                callbackUrls: [
                    callbackUrl,
                ],
            }
        });

        // Retrieve UserPool Client secret, as per workaround described here:
        // https://github.com/aws/aws-cdk/issues/7225#issuecomment-610299259
        const describeCognitoUserPoolClient = new AwsCustomResource(this, 'DescribeCognitoUserPoolClient', {
            resourceType: 'Custom::DescribeCognitoUserPoolClient',
            onCreate: {
                region: Stack.of(userPool).region,
                service: 'CognitoIdentityServiceProvider',
                action: 'describeUserPoolClient',
                parameters: {
                    UserPoolId: userPool.userPoolId,
                    ClientId: client.userPoolClientId,
                },
                physicalResourceId: PhysicalResourceId.of(client.userPoolClientId),
            },
            policy: AwsCustomResourcePolicy.fromSdkCalls({resources: AwsCustomResourcePolicy.ANY_RESOURCE}),
        });

        new StringParameter(this, 'UserPoolClientId', {
            parameterName: `/${uniquePrefix}/userpool/client_id`,
            stringValue: client.userPoolClientId,
        });
        new StringParameter(this, 'UserPoolClientSecret', {
            parameterName: `/${uniquePrefix}/userpool/client_secret`,
            stringValue: describeCognitoUserPoolClient.getResponseField('UserPoolClient.ClientSecret'),
        });
        new StringParameter(this, 'UserPoolDomainPrefix', {
            parameterName: `/${uniquePrefix}/userpool/domain_prefix`,
            stringValue: domain.domainName,
        });
        new StringParameter(this, 'UserPoolRegion', {
            parameterName: `/${uniquePrefix}/userpool/region`,
            stringValue: Stack.of(userPool).region,
        });

        restApi
            .root
            .resourceForPath('/auth/login')
            .addMethod('GET', new LambdaIntegration(new NodejsFunction(this, 'NodejsFunction/login', {
                    entry: path.resolve(__dirname, 'api/lambda/login.lambda.ts'),
                    initialPolicy: [
                        new PolicyStatement({
                            actions: ['ssm:GetParameter'],
                            resources: ['*'],
                        })
                    ],
                    environment: {
                        PARAMETER_STORE_PREFIX: uniquePrefix,
                    },
                })
            ));

        restApi
            .root
            .resourceForPath('/auth/callback')
            .addMethod('GET', new LambdaIntegration(new NodejsFunction(this, 'NodejsFunction/callback', {
                    entry: path.resolve(__dirname, 'api/lambda/callback.lambda.ts'),
                    initialPolicy: [
                        new PolicyStatement({
                            actions: ['ssm:GetParameter'],
                            resources: ['*'],
                        })
                    ],
                    environment: {
                        PARAMETER_STORE_PREFIX: uniquePrefix,
                    },
                })
            ));

        restApi.root
            .resourceForPath('/user')
            .addMethod(
                'GET',
                new LambdaIntegration(new NodejsFunction(this, 'NodejsFunction/getUser', {
                    entry: path.resolve(__dirname, 'api/lambda/getUser.lambda.ts'),
                })),
                {
                    authorizer: cognitoUserPoolsAuthorizer,
                });

        // Infrastructure for /public path of API Gateway, leading to a static dummy frontend
        const frontend = new Frontend(this, 'Frontend');
        restApi.root
            .resourceForPath("public")
            .addProxy({
                defaultIntegration: new HttpIntegration(`${frontend.bucket.bucketWebsiteUrl}/{proxy}`, {
                    httpMethod: "GET",
                    options: {
                        requestParameters: {
                            "integration.request.path.proxy": "method.request.path.proxy",
                        },
                    },
                    proxy: true,
                },),
                defaultMethodOptions: {
                    methodResponses: [{statusCode: "200"}],
                    requestParameters: {
                        "method.request.path.proxy": true,
                    },
                },
            });
    }

}
