Package.describe({
	name: "jkuester:altcha",
	version: "0.0.1",
	// Brief, one-line summary of the package.
	summary: "",
	// URL to the Git repository containing the source code for this package.
	git: "",
	// By default, Meteor will default to using README.md for documentation.
	// To avoid submitting documentation, set this field to null.
	documentation: "README.md",
});

Npm.depends({
	"altcha-lib": "1.2.0",
});

Package.onUse((api) => {
	api.versionsFrom("3.0.4");
	api.use(["ecmascript", "webapp", "mongo"], "server");
	api.mainModule("altcha.js", "server");
});

Package.onTest((api) => {
	api.use("ecmascript");
	api.use("tinytest");
	api.use("jkuester:altcha");
	api.mainModule("altcha-tests.js");
});
