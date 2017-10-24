'use strict';

var AWS_SDK = 'aws-sdk',
    CLOUDWATCH_PLUGIN = __dirname + '/../lib/cloudwatch.js',
    aws = require(AWS_SDK),
    expect = require('chai').expect,
    cloudwatch,
    script = {
        config: {
            plugins: {
                cloudwatch: {
                    namespace: 'MY_NAMESPACE'
                }
            }
        }
    };

if (!aws.config) {
    aws.config = {};
}
if (!aws.config.credentials) {
    aws.config.credentials = {};
}
aws.config.credentials.accessKeyId = '12345678901234567890';
aws.config.credentials.secretAccessKey = '1234567890123456789012345678901234567890';
aws.config.credentials.sessionToken = '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234==';
aws.config.credentials.region = 'my-region';

cloudwatch = require(CLOUDWATCH_PLUGIN);

describe('CloudWatch Plugin Tests', function() {
    before(function() {
        console.log('Running CloudWatch Plugin Tests');
    });
    after(function() {
        console.log('Completed CloudWatch Plugin Tests');
    });
    describe('Validate the configuration of the plugin', function() {
        it('Expects configuration to be provided', function () {
            expect(function () {
                cloudwatch.impl.validateConfig(null);
            }).to.throw(cloudwatch.messages.pluginConfigRequired);
            expect(function () {
                cloudwatch.impl.validateConfig({});
            }).to.throw(cloudwatch.messages.pluginConfigRequired);
            expect(function () {
                cloudwatch.impl.validateConfig({ plugins: {} });
            }).to.throw(cloudwatch.messages.pluginConfigRequired);
        });
        it('Expects configuration to include the attribute `namespace` with a string value', function () {
            expect(function () {
                cloudwatch.impl.validateConfig({ plugins: { cloudwatch: {} } });
            }).to.throw(cloudwatch.messages.pluginParamNamespaceRequired);
            expect(function () {
                cloudwatch.impl.validateConfig({ plugins: { cloudwatch: { namespace: {} } } });
            }).to.throw(cloudwatch.messages.pluginParamNamespaceMustBeString);
            expect(function () {
                cloudwatch.impl.validateConfig({ plugins: { cloudwatch: { namespace: true } } });
            }).to.throw(cloudwatch.messages.pluginParamNamespaceMustBeString);
            expect(function () {
                cloudwatch.impl.validateConfig({ plugins: { cloudwatch: { namespace: 1 } } });
            }).to.throw(cloudwatch.messages.pluginParamNamespaceMustBeString);
            expect(function() {
                cloudwatch.impl.validateConfig({ plugins: { cloudwatch: { namespace: '' } } });
            }).to.throw(cloudwatch.messages.pluginParamNamespaceMustHaveALengthOfAtLeastOne);
        });
        it('Expects valid aws-sdk configuration credentials', function() {
            // delete require.cache[require.resolve('aws-sdk')];
            // delete require.cache[require.resolve('aws-sdk')];
        });
        it('Expects a valid aws-sdk configuration region', function() {
            // delete require.cache[require.resolve('aws-sdk')];
            // delete require.cache[require.resolve('aws-sdk')];
        });
        it('Expects valid configuration produce a usable plugin', function () {
            expect(function() {
                cloudwatch.impl.validateConfig(script.config);
            }).to.not.throw('config is valid');
        });
    });
});
