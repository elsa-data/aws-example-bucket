import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { DataBucketsStack } from "aws-data-buckets";

const app = new cdk.App();

new DataBucketsStack(app, "DataBucketsStack", {
  env: {
    account: "843407916570",
    region: "ap-southeast-2",
  },
  isDevelopment: true,
  bucketNames: ["elsa-data-example-bucket-1", "elsa-data-example-bucket-2"],
  // readOnlyDirectShareAccountIds: ["843407916570"]
});
