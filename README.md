Goals:

1. Configure Cognito user pool with Google federated identity provider
2. Allow users to SSO (Single Sign On) using their account and automatically create a "mirror" user for them in the
   Cognito user pool, so they don't have to remember a separate username/password.
3. Implement a dummy frontend that demonstrates how to redirect to Google, approve the signin, get a Cognito user
   created, get a Cognito token, use it to call private application backed (Lambda-backed API Gateway).
