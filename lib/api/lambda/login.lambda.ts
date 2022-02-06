import {APIGatewayProxyHandler, Handler} from "aws-lambda";
import {SSM} from "aws-sdk";

export const handler: APIGatewayProxyHandler = async (event) => {
    const paramAuthServer = await new SSM().getParameter({
        WithDecryption: true,
        Name: 'login-url',
    }).promise();

    const paramClientId = await new SSM().getParameter({
        WithDecryption: true,
        Name: process.env.STRING_PARAM_USERPOOL_CLIENT as string,
    }).promise();
    const authServer = paramAuthServer.Parameter?.Value;
    const clientId = paramClientId.Parameter?.Value;
    const domainName = event.requestContext.domainName;
    const loginUrl = `${authServer}/oauth2/authorize?identity_provider=Google&redirect_url=${domainName}/auth/callback&response_type=CODE&client_id=${clientId}`;
    return {
        statusCode: 200,
        body: JSON.stringify({
            login_url: loginUrl,
        })
    }
}
