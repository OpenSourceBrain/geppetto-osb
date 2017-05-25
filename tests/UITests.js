var TARGET_URL = "http://0.0.0.0:3000";
var USERNAME = casper.cli.has("username") ?
    casper.cli.get("username") : casper.echo("No username arg supplied").exit();
var PASSWORD = casper.cli.get("password") ?
    casper.cli.get("password") : casper.echo("No password arg supplied").exit();

casper.test.begin('geppetto-osb basic tests', 2, function suite(test) {
    casper.options.viewportSize = {
        width: 1340,
        height: 768
    };

    // add for debug info
    //casper.options.verbose = true;
    //casper.options.logLevel = "debug";

    // show unhandled js errors
    casper.on("page.error", function(msg, trace) {
        this.echo("Error: " + msg, "ERROR");
    });

    // show page level errors
    casper.on('resource.received', function (resource) {
        var status = resource.status;
        if (status >= 400) {
            this.echo('URL: ' + resource.url + ' Status: ' + resource.status);
        }
    });

    casper.start(TARGET_URL, function () {
        this.waitForSelector('.sampleModel', function() {
            var nSamples = this.evaluate(function() { return $('.sampleModel').length; });
            test.assertEquals(nSamples, 5);
        }, null, 30000);
    });

    casper.then(function() {
        this.click('a[href="/login"]', "Navigating to login");
        this.waitUntilVisible('button#loginButton', function() {
            this.sendKeys('input[name="username"]', USERNAME);
            this.sendKeys('input[name="password"]', PASSWORD);
            this.click('button#loginButton', 'logging in');
        });
    });

    casper.then(function() {
        this.waitUntilVisible('.projecttable', function() {
            test.assertVisible('.projecttable');
        }, null, 30000);
    });

    casper.then(function() {});

    casper.run(function() {
        test.done();
    });

})
