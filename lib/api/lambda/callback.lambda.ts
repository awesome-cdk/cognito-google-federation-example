import {Handler} from "aws-lambda";
import axios from "axios";

export const handler: Handler = async (event) => {
    const authorizationCode = event.queryStringParameters.code;

    const result = await axios.post('https://test-2022.auth.us-east-1.amazoncognito.com/oauth2/token', {
        grant_type: 'authorization_code',
        client_id: '7hvpeu8e9efuoou7gvfgb0599',
        redirect_uri: 'https://lcgex3opdd.execute-api.us-east-1.amazonaws.com/prod/callback',
        code: authorizationCode,
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
}
