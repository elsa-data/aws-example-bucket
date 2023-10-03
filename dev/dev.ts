import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { ExampleBucketStack } from "aws-example-bucket";

const app = new cdk.App();

new ExampleBucketStack(app, "ExampleBucketStack", {
  env: {
    account: "843407916570",
    region: "ap-southeast-2",
  },
  isDevelopment: true,
  bucketName: "elsa-data-example-bucket",
});
