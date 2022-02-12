import {SSM} from "aws-sdk";

export async function getParameterValue(parameterName: string) {
    const param = await new SSM()
        .getParameter({
            Name: parameterName,
            WithDecryption: true,
        })
        .promise();
    const value = param.Parameter?.Value as string;
    if (!value) {
        throw new Error(`Can not find SSM parameter with name ${parameterName}`);
    }
    return value;
}
