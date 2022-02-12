import {APIGatewayProxyHandler} from "aws-lambda";
import {URL} from "url";
import {getParameterValue} from "../lambdas/shared/getParameterValue";

export const handler: APIGatewayProxyHandler = async (event) => {
    const userPoolClientId = await getParameterValue(
        `/${String(process.env.PARAMETER_STORE_PREFIX)}/userpool/client_id`
    );
    const userPoolDomainName = await getParameterValue(
        `/${String(process.env.PARAMETER_STORE_PREFIX)}/userpool/domain_prefix`
    );
    const userPoolRegion = await getParameterValue(
        `/${String(process.env.PARAMETER_STORE_PREFIX)}/userpool/region`
    );
    const redirectUrl = await getParameterValue(
        `/${String(process.env.PARAMETER_STORE_PREFIX)}/userpool/callback-url`
    );

    const url = new URL(
        "/oauth2/authorize",
        `https://${userPoolDomainName}.auth.${userPoolRegion}.amazoncognito.com`
    );
    url.searchParams.append("identity_provider", "Google");
    url.searchParams.append("redirect_url", redirectUrl);
    url.searchParams.append("response_type", "code");
    url.searchParams.append("client_id", userPoolClientId);

    return {
        statusCode: 200,
        body: JSON.stringify({
            login_url: url.toString(),
        }),
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
        },
    };
};
