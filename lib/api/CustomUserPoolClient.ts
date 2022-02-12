import {UserPoolClient, UserPoolClientProps} from "aws-cdk-lib/aws-cognito";
import {Construct} from "constructs";
import {AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId} from "aws-cdk-lib/custom-resources";
import {Stack} from "aws-cdk-lib";

/**
 * A slightly modified version of the standard UserPoolClient construct.
 * The only difference being that this exposes a `userPoolClientSecret` field
 */
export class CustomUserPoolClient extends UserPoolClient {

    userPoolClientSecret: string;

    constructor(scope: Construct, id: string, props: UserPoolClientProps) {
        super(scope, id, {
            generateSecret: true,
            ...props,
        });

        // Retrieve UserPool Client secret, as per workaround described here:
        // https://github.com/aws/aws-cdk/issues/7225#issuecomment-610299259
        const describeCognitoUserPoolClient = new AwsCustomResource(
            this,
            "DescribeCognitoUserPoolClient",
            {
                resourceType: "Custom::DescribeCognitoUserPoolClient",
                onCreate: {
                    region: Stack.of(this).region,
                    service: "CognitoIdentityServiceProvider",
                    action: "describeUserPoolClient",
                    parameters: {
                        UserPoolId: props.userPool.userPoolId,
                        ClientId: this.userPoolClientId,
                    },
                    physicalResourceId: PhysicalResourceId.of(this.userPoolClientId),
                },
                policy: AwsCustomResourcePolicy.fromSdkCalls({
                    resources: AwsCustomResourcePolicy.ANY_RESOURCE,
                }),
            }
        );

        this.userPoolClientSecret = describeCognitoUserPoolClient.getResponseField(
            "UserPoolClient.ClientSecret"
        );
    }
}
