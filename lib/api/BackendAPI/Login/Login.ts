import {Construct} from "constructs";
import {IRestApi, LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {IFunction} from "aws-cdk-lib/aws-lambda";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import {PolicyStatement} from "aws-cdk-lib/aws-iam";

export class Login extends Construct {

    constructor(scope: Construct, id: string, props: {
        restApi: IRestApi,
        path: string,
        uniquePrefix: string,
    }) {
        super(scope, id);

        props.restApi.root.resourceForPath(props.path).addMethod(
            'GET',
            new LambdaIntegration(
                new NodejsFunction(this, "NodejsFunction", {
                    entry: path.resolve(__dirname, "Login.lambda.ts"),
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
            )
        );
    }
}
