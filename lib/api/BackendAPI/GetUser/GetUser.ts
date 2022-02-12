import {Construct} from "constructs";
import {AuthorizationType, CognitoUserPoolsAuthorizer, IRestApi, LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

export class GetUser extends Construct {
    constructor(scope: Construct, id: string, props: {
        restApi: IRestApi,
        path: string,
        uniquePrefix: string,
        cognitoUserPoolsAuthorizer: CognitoUserPoolsAuthorizer,
    }) {
        super(scope, id);

        const cognitoUserPoolsAuthorizer = props.cognitoUserPoolsAuthorizer;

        props.restApi.root.resourceForPath(props.path).addMethod(
            'GET',
            new LambdaIntegration(
                new NodejsFunction(this, "NodejsFunction", {
                    entry: path.resolve(__dirname, "GetUser.lambda.ts"),
                    initialPolicy: [
                        new PolicyStatement({
                            actions: ["ssm:GetParameter"],
                            resources: ["*"],
                        }),
                    ],
                    environment: {
                        PARAMETER_STORE_PREFIX: props.uniquePrefix,
                    },
                })
            ),
            {
                authorizer: cognitoUserPoolsAuthorizer,
                authorizationType: AuthorizationType.COGNITO,
            }
        );
    }
}
