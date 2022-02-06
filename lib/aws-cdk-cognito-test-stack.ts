import {CfnOutput, RemovalPolicy, Stack, StackProps} from "aws-cdk-lib";
import {
    ProviderAttribute,
    UserPool,
    UserPoolClient,
    UserPoolClientIdentityProvider,
    UserPoolIdentityProviderGoogle
} from "aws-cdk-lib/aws-cognito";
import {Construct} from "constructs";
import {LambdaIntegration, RestApi} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class AwsCdkCognitoTestStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const userPool = new UserPool(this, "UserPool", {
            removalPolicy: RemovalPolicy.DESTROY,
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
        restApi.root
            .addResource('callback')
            .addMethod(
                'GET',
                new LambdaIntegration(new NodejsFunction(this, 'NodejsFunction/callback', {
                        entry: path.resolve(__dirname, 'api/lambda/callback.lambda.ts'),
                    })
                ));

        const client = new UserPoolClient(this, 'UserPoolClient', {
            userPool,
            authFlows: {
                userPassword: true,
                custom: true,
            },
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.GOOGLE,
                UserPoolClientIdentityProvider.COGNITO,
            ],
            oAuth: {
                callbackUrls: [
                    restApi.urlForPath('/callback'),
                ],
            }
        });

        // https://test-2022.auth.us-east-1.amazoncognito.com/oauth2/authorize?identity_provider=Google&redirect_uri=https://lcgex3opdd.execute-api.us-east-1.amazonaws.com/prod/callback&response_type=CODE&client_id=7hvpeu8e9efuoou7gvfgb0599&scope=openid

        const domain = userPool.addDomain('default', {
            cognitoDomain: {
                domainPrefix: 'test-2022',
            },
        });
        const signInUrl = domain.signInUrl(client, {
            redirectUri: "https://abv.bg",
        })

        new CfnOutput(this, 'UserPoolDomain', {
            value: domain.domainName,
        });
        new CfnOutput(this, 'UserPoolDomain-GoogleRedirectUrl', {
            value: domain.domainName + '/oauth2/idpresponse',
        });
        new CfnOutput(this, 'UserPoolDomain-signInUrl', {
            value: signInUrl,
        });
    }
}
