'use strict';

var aws = require('aws-sdk'),
    cloudWatch = new aws.CloudWatch(),
    constants = {
        PLUGIN_NAME: 'cloudwatch',
        PLUGIN_PARAM_NAMESPACE: 'namespace',
        // PLUGIN_PARAM_METRICS: 'metrics',
        THE: 'The "',
        CONFIG_REQUIRED: '" plugin requires configuration under [script].config.plugins.',
        PARAM_REQUIRED: '" parameter is required',
        PARAM_MUST_BE_STRING: '" param must have a string value',
        PARAM_MUST_BE_ARRAY: '" param must have an array value',
        // Report Array Positions
        TIMESTAMP: 0,
        REQUEST_ID: 1,
        LATENCY: 2,
        STATUS_CODE: 3
    },
    messages = {
        pluginConfigRequired: constants.THE + constants.PLUGIN_NAME + constants.CONFIG_REQUIRED + constants.PLUGIN_NAME,
        pluginParamNamespaceRequired: constants.THE + constants.PLUGIN_PARAM_NAMESPACE + constants.PARAM_REQUIRED,
        pluginParamNamespaceMustBeString: constants.THE + constants.PLUGIN_PARAM_NAMESPACE + constants.PARAM_MUST_BE_STRING//,
        // pluginParamMetricsRequired: constants.THE + constants.PLUGIN_PARAM_METRICS + constants.PARAM_REQUIRED,
        // pluginParamMetricsMustBeArray: constants.THE + constants.PLUGIN_PARAM_METRICS + constants.PARAM_MUST_BE_ARRAY
    },
    impl = {
        validateConfig: function(scriptConfig) {
            // Validate that plugin config exists
            if (!(scriptConfig && scriptConfig.plugins && constants.PLUGIN_NAME in scriptConfig.plugins)) {
                throw new Error(messages.pluginConfigRequired);
            }
            // Validate NAMESPACE
            if (!(constants.PLUGIN_PARAM_NAMESPACE in scriptConfig.plugins[constants.PLUGIN_NAME])) {
                throw new Error(messages.pluginParamNamespaceRequired);
            } else if (!('string' === typeof scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_NAMESPACE] ||
                scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_NAMESPACE] instanceof String)) {
                throw new Error(messages.pluginParamNamespaceMustBeString);
            }
            // // Validate METRICS
            // if (!(messages.PLUGIN_PARAM_METRICS in pluginConfig)) {
            //     throw new Error(messages.pluginParamMetricsRequired)
            // } else if (!Array.isArray(pluginConfig[messages.PLUGIN_PARAM_METRICS])) {
            //     throw new Error(messages.pluginParamMetricsMustBeArray);
            // }
            // for(var i = 0; pluginConfig[messages.PLUGIN_PARAM_METRICS].length; i++) {
            //     validateMetric(pluginConfig[messages.PLUGIN_PARAM_METRICS][i]);
            // }
        },
        buildCloudWatchParams: function(namespace, latency, latencies) {
            var cloudWatchParams = {
                    Namespace: namespace,
                    MetricData: []
                },
                lastLatency = Math.min(latency + 20, latencies.length);
            for(var i = latency; i < lastLatency; i++) {
                cloudWatchParams.MetricData.push({
                    MetricName: 'ResultLatency',
                    Dimensions: [],
                    Timestamp: (new Date(latencies[i][constants.TIMESTAMP])).toISOString(),
                    Value: latencies[i][constants.LATENCY] / 1000000,
                    Unit: 'Milliseconds'
                });
            }
            return cloudWatchParams;
        }
    },
    api = {
        init: function(scriptConfig, eventEmitter) {
            return new CloudWatchPlugin(scriptConfig, eventEmitter);
        }
    };

function CloudWatchPlugin(scriptConfig, eventEmitter) {
    var self = this;
    impl.validateConfig(scriptConfig);
    self.config = JSON.parse(JSON.stringify(scriptConfig.plugins[constants.PLUGIN_NAME]));
    eventEmitter.on('done', function(report) {
        var latency = 0,
            latencies = report.aggregate.latencies,
            cloudWatchParams;
        while(latency < latencies.length) {
            cloudWatchParams = impl.buildCloudWatchParams(self.config[constants.PLUGIN_PARAM_NAMESPACE], latency, latencies);
            cloudWatch.putMetricData(cloudWatchParams, function (err) {
                if (err) {
                    console.log('Error reporting metrics to CloudWatch via putMetricData:', err);
                }
            });
            latency += cloudWatchParams.MetricData.length;
        }
        console.log('Metrics reported to CloudWatch');
    });
}

CloudWatchPlugin.prototype.report = function() {
    var reports = null; // an array, if returning any reports
    // build reports and add them to reports
    // enact custom reporting actions
    return reports;
};

/**
 * Configuration:
 *  {
 *      "config": {
 *          "plugins": {
 *              "cloudwatch": {
 *                  "namespace": "[INSERT_NAMESPACE]",
 // *                  "metrics": [
 // *                      {
 // *                          "name": "[METRIC_NAME]",
 // *                          "dimensions": [...],
 // *
 // *                      }
 // *                  ]
 *              }
 *          }
 *      }
 *  }
 */
module.exports = api.init;

/* test-code */
module.exports.constants = constants;
module.exports.messages = messages;
module.exports.impl = impl;
module.exports.api = api;
/* end-test-code */
