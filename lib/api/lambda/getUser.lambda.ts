import {APIGatewayProxyHandler} from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify({
            user: event.requestContext.authorizer,
        }),
        headers: {
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
        }
    }
}
