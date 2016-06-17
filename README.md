# artillery-plugin-cloudwatch
A plugin for artillery.io that records response data into cloudwatch.

To use:
1. `npm install -g artillery`
2. `npm install artillery-plugin-cloudwatch` (add `-g` if you like)
3. Add `cloudwatch` plugin config to your "`hello.json`" Artillery script
    ```
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

For more information, see:

* https://github.com/shoreditch-ops/artillery
* http://docs.aws.amazon.com/AmazonCloudWatch/latest/DeveloperGuide/WhatIsCloudWatch.html

Enjoy!
