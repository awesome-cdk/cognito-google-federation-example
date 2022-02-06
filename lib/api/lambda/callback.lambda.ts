import {APIGatewayProxyHandler, Handler} from "aws-lambda";
import axios from "axios";
import * as querystring from "querystring";

export const handler: APIGatewayProxyHandler = async (event) => {
    try {
        const authorizationCode = event.queryStringParameters!.code;

        const clientId = '6hcdr9ei7kvpug7jposnsedt5f';
        const clientSecret = '1j7st358fg609ip6tq6v5hna1vfrreau1k9jibsll0ep9t1m678k';

        const data = querystring.stringify({
            grant_type: 'authorization_code',
            client_id: clientId,
            redirect_uri: 'https://lcgex3opdd.execute-api.us-east-1.amazonaws.com/prod/auth/callback',
            code: authorizationCode,
        });

        const result = await axios.post('https://test-2022.auth.us-east-1.amazoncognito.com/oauth2/token', data, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        console.log(result.status);
        console.log(result.data);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                data: result.data,
            }),
        }
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify(e, null, 2),
        }
    }
}
