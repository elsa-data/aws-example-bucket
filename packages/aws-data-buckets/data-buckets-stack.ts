import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { CfnEventDataStore } from "aws-cdk-lib/aws-cloudtrail";
import {
  AccountPrincipal,
  AnyPrincipal,
  Effect,
  PolicyStatement,
} from "aws-cdk-lib/aws-iam";
import { createHash } from "node:crypto";

export interface DataBucketsStackProps extends StackProps {
  /**
   * If true indicates that these are development buckets that
   * may have looser restrictions on deletion etc.
   */
  readonly isDevelopment?: boolean;

  /**
   * The name of the buckets that we want to create.
   */
  readonly bucketNames: string[];

  /**
   * If present, the account ids that these buckets should directly be shared with for Gets.
   * There are some cases where we want to allow direct sharing of all files
   * (outside the control of Elsa Data). Obviously this would mainly be for
   * dev scenarios.
   */
  readonly readOnlyDirectShareAccountIds?: string[];
}

/**
 * A stack deploying a bucket and cloudtrail etc that can be used for example data.
 */
export class DataBucketsStack extends Stack {
  constructor(scope: Construct, id: string, props: DataBucketsStackProps) {
    super(scope, id, props);

    const buckets: Bucket[] = [];

    for (const bn of props.bucketNames) {
      // we use a hash to make unique but consistent names for the CDK artifacts
      const bucketNameHash = createHash("md5").update(bn).digest("hex");

      // create buckets with suitable permissions and settings
      const bucket = new Bucket(this, `Bucket${bucketNameHash}`, {
        bucketName: bn,
        // in dev, assuming someone has emptied out the bucket - we don't care if it is destroyed
        removalPolicy: props.isDevelopment
          ? RemovalPolicy.DESTROY
          : RemovalPolicy.RETAIN,
        // we always want to manually delete the data objects even in dev - given the
        // object will have been created manually - they may be of some value
        autoDeleteObjects: false,
        // versioned buckets generally allow more things (like replication) - even if we
        // don't particularly need the versioning ourselves
        versioned: true,
        // clear out deleted objects
        lifecycleRules: [
          {
            noncurrentVersionExpiration: Duration.days(
              props.isDevelopment ? 1 : 30
            ),
            enabled: true,
          },
        ],
      });

      // one sharing mechanism will be using AWS access points
      // this policy defers decisions to any access points in our account
      bucket.addToResourcePolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ["s3:Get*", "s3:List*"],
          principals: [new AnyPrincipal()],
          resources: [bucket.bucketArn, bucket.arnForObjects("*")],
          conditions: {
            StringEquals: {
              "s3:DataAccessPointAccount": Stack.of(this).account,
            },
          },
        })
      );

      // allow Gets from specified account if this is another (non Elsa Data) way we want to share data
      if (props.readOnlyDirectShareAccountIds) {
        bucket.addToResourcePolicy(
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ["s3:GetObject"],
            principals: (props.readOnlyDirectShareAccountIds ?? []).map(
              (ac) => new AccountPrincipal(ac)
            ),
            resources: [bucket.arnForObjects("*")],
          })
        );
      }

      buckets.push(bucket);
    }

    // a CloudTrail Lake that stores just data events for our buckets
    const cfnEventDataStore = new CfnEventDataStore(
      this,
      "CloudTrailEventDataStore",
      {
        advancedEventSelectors: [
          {
            fieldSelectors: [
              {
                field: "eventCategory",
                equalTo: ["Data"],
              },
              {
                field: "resources.type",
                equalTo: ["AWS::S3::Object"],
              },
              {
                field: "resources.ARN",
                startsWith: buckets.map((b) => b.bucketArn),
              },
            ],
          },
        ],
        // in the cases where we allow egress out to other regions I presume the events might occur there?
        multiRegionEnabled: true,
        organizationEnabled: false,
        retentionPeriod: props.isDevelopment
          ? 30 /* keep for a month (only for dev) */
          : 365,
        terminationProtectionEnabled: !!props.isDevelopment,
      }
    );

    // outputs for use in Elsa Data configuration

    new CfnOutput(this, "CloudTrailLakeArnOutput", {
      value: cfnEventDataStore.attrEventDataStoreArn,
      description: "The ARN for CloudTrail Lake",
      exportName: "CloudTrailLakeArn",
    });
  }
}
