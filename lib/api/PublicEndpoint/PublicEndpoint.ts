import {Construct} from "constructs";
import {IRestApi, LambdaIntegration} from "aws-cdk-lib/aws-apigateway";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

export class PublicEndpoint extends Construct {

    constructor(scope: Construct, id: string, props: {
        restApi: IRestApi,
    }) {
        super(scope, id);
        props.restApi.root.resourceForPath("public").addMethod(
            "ANY",
            new LambdaIntegration(
                new NodejsFunction(this, "NodejsFunction", {
                    entry: path.resolve(__dirname, "PublicEndpoint.lambda.ts"),
                    environment: {
                        BASE_URL: '/prod'
                    },
                    bundling: {
                        nodeModules: ["ejs"],
                        commandHooks: {
                            beforeBundling(inputDir: string, outputDir: string): string[] {
                                return [];
                            },
                            afterBundling(inputDir: string, outputDir: string): string[] {
                                const viewsPath = path.resolve(
                                    __dirname,
                                    "./../../../dummy-frontend/src/views"
                                );
                                return [`cp -R ${viewsPath} ${outputDir}/views`];
                            },
                            beforeInstall() {
                                return [];
                            },
                            // ...
                        },
                    },
                })
            )
        );
    }
}
