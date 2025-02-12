// Import Tinytest from the tinytest Meteor package.
import { Tinytest } from "meteor/tinytest";

// Import and rename a variable exported by altcha.js.
import { name as packageName } from "meteor/jkuester:altcha";

// Write your tests here!
// Here is an example.
Tinytest.add("altcha - example", (test) => {
	test.equal(packageName, "altcha");
});
