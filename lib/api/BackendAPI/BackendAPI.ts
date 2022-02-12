import {Construct} from "constructs";
import {CognitoUserPoolsAuthorizer, RestApi} from "aws-cdk-lib/aws-apigateway";
import {Duration} from "aws-cdk-lib";
import {IUserPool} from "aws-cdk-lib/aws-cognito";
import {Login} from "./Login/Login";
import {GetToken} from "./GetToken/GetToken";
import {GetUser} from "./GetUser/GetUser";

export class BackendAPI extends Construct {
    api: RestApi;

    constructor(scope: Construct, id: string, props: {
        uniquePrefix: string,
        userPool: IUserPool,
    }) {
        super(scope, id);

        const uniquePrefix = props.uniquePrefix;

        const cognitoUserPoolsAuthorizer = new CognitoUserPoolsAuthorizer(this, "CognitoUserPoolsAuthorizer", {
            cognitoUserPools: [props.userPool],
            resultsCacheTtl: Duration.seconds(0),
        });

        this.api = new RestApi(this, "RestApi", {
            deployOptions: {
                cacheTtl: Duration.seconds(0),
                throttlingBurstLimit: 1,
                throttlingRateLimit: 1,
            },
            defaultCorsPreflightOptions: {
                allowMethods: ["*"],
                allowOrigins: ["*"],
                allowHeaders: ["*"],
                allowCredentials: true,
            },
        });

        new Login(this, 'Login', {
            restApi: this.api,
            path: '/auth/login',
            uniquePrefix,
        });

        new GetToken(this, 'GetToken', {
            restApi: this.api,
            path: '/auth/token',
            uniquePrefix,
        });

        new GetUser(this, 'GetUser', {
            restApi: this.api,
            path: '/user',
            uniquePrefix,
            cognitoUserPoolsAuthorizer,
        });
    }
}
