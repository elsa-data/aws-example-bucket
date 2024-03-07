# AWS Data Buckets

A CDK stack showing the correct creation of buckets
(and accompanying CloudTrail Lake) for storing
genomic data.

## Rationale

There are some aspects of our genomic data buckets that
make them work better in our proposed Elsa Data architecture.

- A specific CloudTrail Lake is created to track all the
  data plane events that occur across all the buckets. This can then
  be ingested into Elsa Data for auditing
- Permissions are set up to allow the addition of S3 access
  points

It is not however a requirement that only buckets created with this
stack will work with Elsa Data - just that this bucket stack is
a canonical example of the configuration of features
that work well with Elsa Data.

## Development

### Deploy

Deploy the stack into development account to test changes.

```
cd dev
pnpm run deploy
```

### Destroy

The stack can be entirely removed (though any test files placed into the buckets
will have to be removed first). Note that there will be some delay (hours?)
before the bucket names can be re-used (so there will be some delay before you
can deploy again).

```
cd dev
pnpm run destroy
```

## Release

Create a release in GitHub to create/publish an NPM package and
have it pushed into the NPM registry.
