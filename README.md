# artillery-plugin-cloudwatch
A plugin for artillery.io that records response data into cloudwatch.

To use:

1. `npm install -g artillery`
2. `npm install artillery-plugin-cloudwatch` (add `-g` if you like)
3. Add `cloudwatch` plugin config to your "`hello.json`" Artillery script

    ```json
    {
      "config": {
        "plugins": [
          "cloudwatch": {
              "namespace": "[INSERT_NAMESPACE]"
          }
        ]
      }
    }
    ```

4. `artillery run hello.json`

This will cause every latency to be published to the given CloudWatch namespace with the metric "ResultLatency".

This plugin assumes that the `aws-sdk` has been pre-configured, before it is loaded, with credentials and any other
setting that may be required to successfully execute a `PutMetricData` against the CloudWatch API.  This activity
requires at least the rights given by the following IAM statement to the CloudWatch API in order to report latencies:

```json
{
    "Effect": "Allow",
    "Action": [
        "cloudwatch:PutMetricData"
    ],
    "Resource": ["*"]
}
```

For more information, see:

* https://github.com/shoreditch-ops/artillery
* http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/WhatIsCloudWatch.html

Enjoy!
