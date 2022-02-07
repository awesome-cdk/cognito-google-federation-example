import {Construct} from "constructs";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {RemovalPolicy} from "aws-cdk-lib";
import {BucketDeployment, CacheControl, Source} from "aws-cdk-lib/aws-s3-deployment";
import * as path from "path";

export class Frontend extends Construct {
    bucket: Bucket;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.bucket = new Bucket(this, 'Bucket', {
            removalPolicy: RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            publicReadAccess: true,
        });

        new BucketDeployment(this, 'BucketDeployment', {
            destinationBucket: this.bucket,
            // destinationKeyPrefix: 'prod/public',
            sources: [
                Source.asset(path.resolve(__dirname, './static')),
            ],
            exclude: [
                '.gitignore',
            ],
            retainOnDelete: false,
            cacheControl: [
                CacheControl.noCache(),
                CacheControl.mustRevalidate(),
            ],
        });
    }
}
