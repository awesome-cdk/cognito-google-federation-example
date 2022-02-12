import ServerlessHttp = require("serverless-http");
import app from "../../../dummy-frontend/src/app";

/**
 * Wrap the Express app and expose it under the /public path of the API Gateway
 */
export const handler = ServerlessHttp(app, {
    basePath: "/public",
});
