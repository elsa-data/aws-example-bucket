# AWS Data Buckets

A CDK stack showing the correct creation of buckets
(and accompanying CloudTrail Lake) for storing
genomic data.

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
