Package.describe({
	name: "jkuester:altcha",
	version: "1.0.1",
	// Brief, one-line summary of the package.
	summary: "Meteor Integration for altcha",
	// URL to the Git repository containing the source code for this package.
	git: "https://github.com/jankapunkt/meteor-altcha.git",
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: "README.md",
});

ALTCHA_VERSION = "1.2.0";

Package.onUse((api) => {
	Npm.depends({
		"altcha-lib": ALTCHA_VERSION,
	});
	api.versionsFrom("3.0.4");
	api.use(["ecmascript", "webapp", "mongo"], "server");
	api.mainModule("altcha.js", "server");
});

Package.onTest((api) => {
	Npm.depends({
		chai: "5.1.2",
		"altcha-lib": ALTCHA_VERSION,
	});
	api.use("ecmascript");
	api.use("meteortesting:mocha@3.2.0");
	api.use("mongo");
	api.use("jkuester:altcha");
	api.mainModule("altcha-tests.js", "server");
});
