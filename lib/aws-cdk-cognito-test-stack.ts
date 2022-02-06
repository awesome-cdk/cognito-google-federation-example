import {CfnOutput, Lazy, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {
    ProviderAttribute,
    UserPool,
    UserPoolClient,
    UserPoolClientIdentityProvider,
    UserPoolIdentityProviderGoogle,
    OAuthScope
} from "aws-cdk-lib/aws-cognito";
import {Construct} from "constructs";
import {LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {StringParameter} from "aws-cdk-lib/aws-ssm";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

export class AwsCdkCognitoTestStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const userPool = new UserPool(this, "UserPool", {
            removalPolicy: RemovalPolicy.DESTROY,
        });
        const domain = userPool.addDomain('default', {
            cognitoDomain: {
                domainPrefix: 'test-2022',
            },
        });

        new UserPoolIdentityProviderGoogle(this, 'Google', {
            userPool,
            clientId: '727537661772-gvsqml5fj15odn7i9ut3q0std5a9fko2.apps.googleusercontent.com',
            clientSecret: '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',
            scopes: [
                'email',
            ],
            attributeMapping: {
                email: ProviderAttribute.GOOGLE_EMAIL,
            },
        });

        const restApi = new RestApi(this, 'RestApi');
        const authResource = restApi.root.addResource('auth');

        const client = new UserPoolClient(this, 'UserPoolClient', {
            userPool,
            authFlows: {
                userPassword: true,
                custom: true,
                adminUserPassword: true,
                userSrp: true,
            },
            generateSecret: true,
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.GOOGLE,
                UserPoolClientIdentityProvider.COGNITO,
            ],
            oAuth: {
                scopes: [
                    OAuthScope.EMAIL,
                ],
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: true,
                },
                callbackUrls: [
                    restApi.urlForPath('/auth/callback'),
                ],
            }
        });
        // https://test-2022.auth.us-east-1.amazoncognito.com/oauth2/authorize?identity_provider=Google&redirect_uri=https://lcgex3opdd.execute-api.us-east-1.amazonaws.com/prod/callback&response_type=CODE&client_id=6hcdr9ei7kvpug7jposnsedt5f&scope=email

        const signInUrl = domain.signInUrl(client, {
            redirectUri: restApi.urlForPath('/auth/callback'),
        });

        authResource
            .addResource('callback')
            .addMethod(
                'GET',
                new LambdaIntegration(new NodejsFunction(this, 'NodejsFunction/callback', {
                        entry: path.resolve(__dirname, 'api/lambda/callback.lambda.ts'),
                    })
                ));

        const LOGIN_URL = `https://${domain.domainName}.auth.${Stack.of(userPool).region}.amazoncognito.com/oauth2/authorize?identity_provider=Google&redirect_url=${restApi.urlForPath('/auth/callback')}&response_type=CODE&client_id=${client.userPoolClientId}`;

        new CfnOutput(this, 'GoogleLoginURL', {
            value: LOGIN_URL,
        });

        new StringParameter(this, 'LoginUrl', {
            parameterName: 'login-url',
            stringValue: LOGIN_URL,
        })

        authResource
            .addResource('login')
            .addMethod(
                'GET',
                new LambdaIntegration(new NodejsFunction(this, 'NodejsFunction/login', {
                        entry: path.resolve(__dirname, 'api/lambda/login.lambda.ts'),
                        initialPolicy: [
                            new PolicyStatement({
                                actions: ['ssm:GetParameter'],
                                resources: ['*'],
                            })
                        ],
                    })
                ));
    }
}
