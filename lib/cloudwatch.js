'use strict';

var aws = require('aws-sdk'),
    cloudWatch = new aws.CloudWatch(),
    constants = {
        PLUGIN_NAME: 'cloudwatch',
        PLUGIN_PARAM_NAMESPACE: 'namespace',
        PLUGIN_PARAM_TEST_NAME: 'testName',
        PLUGIN_PARAM_ENVIRONMENT: 'environment',
        THE: 'The "',
        CONFIG_REQUIRED: '" plugin requires configuration under <script>.config.plugins.',
        PARAM_REQUIRED: '" parameter is required',
        PARAM_MUST_BE_STRING: '" param must have a string value',
        PARAM_MUST_HAVE_LENGTH_OF_AT_LEAST_ONE: '" param must have a length of at least one',
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
        pluginParamNamespaceMustBeString: constants.THE + constants.PLUGIN_PARAM_NAMESPACE + constants.PARAM_MUST_BE_STRING,
        pluginParamNamespaceMustHaveALengthOfAtLeastOne: constants.THE + constants.PLUGIN_PARAM_NAMESPACE + constants.PARAM_MUST_HAVE_LENGTH_OF_AT_LEAST_ONE,
        pluginParamTestNameRequired: constants.THE + constants.PLUGIN_PARAM_TEST_NAME + constants.PARAM_REQUIRED,
        pluginParamTestNameMustBeString: constants.THE + constants.PLUGIN_PARAM_TEST_NAME + constants.PARAM_MUST_BE_STRING,
        pluginParamTestNameMustHaveALengthOfAtLeastOne: constants.THE + constants.PLUGIN_PARAM_TEST_NAME + constants.PARAM_MUST_HAVE_LENGTH_OF_AT_LEAST_ONE,
        pluginParamEnvironmentMustBeString: constants.THE + constants.PLUGIN_PARAM_ENVIRONMENT + constants.PARAM_MUST_BE_STRING,
        pluginParamEnvironmentHaveALengthOfAtLeastOne: constants.THE + constants.PLUGIN_PARAM_ENVIRONMENT + constants.PARAM_MUST_HAVE_LENGTH_OF_AT_LEAST_ONE,
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
            } else if (scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_NAMESPACE].length === 0) {
                throw new Error(messages.pluginParamNamespaceMustHaveALengthOfAtLeastOne);
            }
            // Validate TEST_NAME
            if (!(constants.PLUGIN_PARAM_TEST_NAME in scriptConfig.plugins[constants.PLUGIN_NAME])) {
                throw new Error(messages.pluginParamTestNameRequired);
            } else if (!(typeof scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_TEST_NAME] === 'string' || scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_TEST_NAME] instanceof String)) {
                throw new Error(messages.pluginParamTestNameMustBeString);
            } else if (scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_TEST_NAME].length === 0) {
                throw new Error(messages.pluginParamTestNameMustHaveALengthOfAtLeastOne);
            }
            // Validate ENVIRONMENT
            if ((constants.PLUGIN_PARAM_ENVIRONMENT in scriptConfig.plugins[constants.PLUGIN_NAME])) {
                if (!(typeof scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_ENVIRONMENT] === 'string' || scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_ENVIRONMENT] instanceof String)) {
                throw new Error(messages.pluginParamEnvironmentMustBeString);
                } else if (scriptConfig.plugins[constants.PLUGIN_NAME][constants.PLUGIN_PARAM_ENVIRONMENT].length === 0) {
                throw new Error(messages.pluginParamEnvironmentHaveALengthOfAtLeastOne);
                }
            }
        },
        buildReportResults: function (instance, testReport) {
            const points = [];
            const dimensions = [
              {
                Name: 'CATEGORY',
                Value: 'performance'
              },
              ...instance.baseDimensions
            ];
        
            if (testReport._entries) {
              testReport.latencies = testReport._entries;
            }
        
            if (testReport.latencies) {
              for (let i = 0; i < testReport.latencies.length; i += 1) {
                const sample = testReport.latencies[i];
        
                const timestamp = (new Date(sample[constants.TIMESTAMP])).toISOString();
        
                points.push({
                  MetricName: 'Latency',
                  Dimensions: [{
                    Name: 'TYPE',
                    Value: 'latency'
                  }, ...dimensions],
                  Timestamp: timestamp,
                  Value: sample[constants.LATENCY] / 1000000,
                  StorageResolution: 1,
                  Unit: 'Milliseconds'
                });
        
                points.push({
                  MetricName: `StatusCode-${sample[constants.STATUS_CODE]}`,
                  Dimensions: [{
                    Name: 'TYPE',
                    Value: 'statusCode'
                  }, ...dimensions],
                  Timestamp: timestamp,
                  Unit: 'Count',
                  StorageResolution: 1,
                  Value: 1,
                });
              }
            }
        
            return points;
        },
        buildReportErrors: function (instance, testReport) {
            let errorCount = 0;
            const dimensions = [
              {
                Name: 'CATEGORY',
                Value: 'performance'
              },
              {
                Name: 'TYPE',
                Value: 'error'
              },
              ...instance.baseDimensions
            ];
        
            if (testReport._errors) {
              testReport.errors = testReport._errors;
            }
        
            if (testReport.errors) {
              Object.getOwnPropertyNames(testReport.errors).forEach((propertyName) => {
                errorCount += testReport.errors[propertyName];
              });
            }
        
            return [{
              MetricName: 'Error',
              Dimensions: dimensions,
              Timestamp: (new Date()).toISOString(),
              Unit: 'Count',
              StorageResolution: 1,
              Value: errorCount,
            }];
        },
        buildCountMetrics: function (instance, testReport) {
            const timestamp = Math.max.apply(null, testReport._requestTimestamps);
            const dimensions = [
              {
                Name: 'CATEGORY',
                Value: 'flows'
              },
              {
                Name: 'TYPE',
                Value: 'count'
              },
              ...instance.baseDimensions
            ];
        
            const counters = {
              generatedScenarios: 0,
              completedScenarios: 0,
              completedRequests: 0
            };
        
            if (testReport._generatedScenarios) {
              const codeFamily = 'generatedScenarios';
              counters[codeFamily] += testReport._generatedScenarios;
            }
            if (testReport._completedScenarios) {
              const codeFamily = 'completedScenarios';
              counters[codeFamily] += testReport._completedScenarios;
            }
            if (testReport._completedRequests) {
              const codeFamily = 'completedRequests';
              counters[codeFamily] += testReport._completedRequests;
            }
            const metrics = Object.entries(counters)
              .map(([counter, amount]) => ({
                MetricName: counter,
                Dimensions: dimensions,
                Timestamp: (new Date(timestamp)).toISOString(),
                StorageResolution: 1,
                Unit: 'Count',
                Value: amount,
              }));
            return metrics;
        },
        CloudWatchPlugin: function(scriptConfig, eventEmitter) {
            var self = this,
                reportError = function (err) {
                    if (err) {
                        console.log('Error reporting metrics to CloudWatch via putMetricData:', err);
                    }
                };
            self.config = JSON.parse(JSON.stringify(scriptConfig.plugins[constants.PLUGIN_NAME]));

            self.baseDimensions = [{
                Name: 'TEST_NAME',
                Value: self.config[constants.PLUGIN_TEST_NAME]
            }];
          
            if (self.config[constants.PLUGIN_ENVIRONMENT]) {
                self.baseDimensions.push({
                    Name: 'ENVIRONMENT',
                    Value: self.config[constants.PLUGIN_ENVIRONMENT]
                });
            }
            
            eventEmitter.on('stats', function (report) {
                try {
                    const reportMetrics = impl.buildReportResults(self, report);
                    const countMetrics = impl.buildCountMetrics(self, report);
                    const errorMetrics = impl.buildReportErrors(self, report);

                    const metricData = [].concat(reportMetrics, countMetrics, errorMetrics);

                    for (let i = 0; i < metricData.length; i += constants.MAX_METRIC_DATA_SIZE) {
                        const data = metricData.slice(i, i + constants.MAX_METRIC_DATA_SIZE);
                        const cloudWatchParams = {
                        Namespace: self.config[constants.PLUGIN_PARAM_NAMESPACE],
                        MetricData: data
                        };
                        cloudWatch.putMetricData(cloudWatchParams, reportError);
                    }
                    console.log('Metrics reported to CloudWatch');
                } catch (err) {
                reportError(err);
              }
            });
        }
    },
    api = {
        init: function (scriptConfig, eventEmitter) {
            impl.validateConfig(scriptConfig);
            return new impl.CloudWatchPlugin(scriptConfig, eventEmitter);
        }
    };

/**
 * Configuration:
 *  {
 *      "config": {
 *          "plugins": {
 *              "cloudwatch": {
 *                  "namespace": "[INSERT_NAMESPACE]",
 *                  "testName": "[INSERT_TEST_NAME]"
 // *                  Optional:
 // *               "environment": "[INSERT_ENVIRONMENT]"     
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
