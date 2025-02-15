import { Meteor } from "meteor/meteor";
import { webcrypto } from "node:crypto";
import { Mongo } from "meteor/mongo";
import { WebApp } from "meteor/webapp";
import { createChallenge, verifySolution } from "altcha-lib";

/**
 * @module
 *
 * @name jkuester:altcha
 * @description
 * Easy Meteor integration for altcha. For client integration
 * please look at he altcha documentation at https://altcha.org.
 *
 * @example
 * import { Meteor } from 'meteor/meteor';
 * import { * as Alcha } from 'meteor/jkuester:altcha'
 *
 * Meteor.startup(() => {
 *   Altcha.init()
 * });
 *
 * Meteor.methods({
 *   async validateForm ({ username, altcha }) {
 *     const isValid = await Altcha.validate(altcha);
 *     if (!isValid) {
 *       throw new Meteor.Error(403, 'challenge failed')
 *     }
 *     // challenge passed, you can
 *     // continue with the form submission
 *     // data processing
 *   }
 * })
 *
 * @see https://altcha.org
 */

/**
 * @private
 * @type {{
 *  expirationAfter: number,
 *  maxNumber: number,
 *  debug: function,
 *  hmacKey: string,
 *  storage: Mongo.Collection,
 *  challengeUrl: string,
 *  algorithm: ('SHA-1'|'SHA-256'|'SHA-512')
 *  }}
 */
const internal = ((settings) => ({
	algorithm: settings.algorithm,
	hmacKey: settings.hmacKey,
	maxNumber: settings.maxNumber,
	expirationAfter: settings.expirationAfter,
	storage: null,
	challengeUrl: settings.challengeUrl,
	debug: () => {},
}))(Meteor.settings.altcha);

/**
 * Initializes the internals:
 * - set debug handler (optional)
 * - set storage Collection
 * - ensure environment (crypto)
 * - setup the endpoint
 * @function
 * @export
 * @param debug
 * @param storage
 */
export const init = ({ debug, storage } = {}) => {
	if (typeof debug === "function") {
		internal.debug = debug;
	}

	// XXX: apply fix for Node 16
	// see https://github.com/altcha-org/altcha-lib?tab=readme-ov-file#usage-with-nodejs-16
	if (typeof globalThis.crypto === "undefined") {
		globalThis.crypto = webcrypto;
	}

	// the default storage is in-memory
	// but users can define their own
	internal.debug(
		`set new storage ${storage?._name ?? storage?.name ?? "in-memory (RAM)"}`,
	);
	internal.storage =
		typeof storage !== "undefined" && storage instanceof Mongo.Collection
			? storage
			: new Mongo.Collection(typeof storage === "string" ? storage : null);

	internal.debug(`create endpoint [GET] ${internal.challengeUrl}`);
	WebApp.rawHandlers.get(internal.challengeUrl, async (req, res) => {
		internal.debug("request challenge");

		let expires;

		if (typeof internal.expirationAfter === "number") {
			const timestamp = Date.now() + internal.expirationAfter;
			expires = new Date(timestamp);
			internal.debug("set challenge expiration to", expires.toLocaleString());
		}

		const challenge = await createChallenge({
			algorithm: internal.algorithm,
			hmacKey: internal.hmacKey,
			maxNumber: internal.maxNumber,
			expires,
		});

		internal.debug("challenge created", challenge);
		res
			.set({
				"Cache-Control":
					"no-store, no-cache, must-revalidate, proxy-revalidate",
				Pragma: "no-cache",
				Expires: 0,
				"Surrogate-Control": "no-store",
			})
			.status(200)
			.json(challenge);
	});
};

/**
 * Validates the given payload for a requested challenge.
 * Checks, whether a challenge has already been in use
 * and aborts respectively (mitigate replay attack).
 * @function
 * @export
 * @param payload {string} the exact payload, returned from the form
 * @return {Promise<boolean>}
 */
export const validate = async (payload) => {
	internal.debug("validate payload", payload);
	if (typeof payload !== "string") {
		return false;
	}

	const data = parse(payload);
	if (!data) {
		return false;
	}

	const { challenge } = data;
	internal.debug("payload challenge is", challenge);

	// prevent retry attack
	const wasSolved =
		challenge && (await internal.storage.countDocuments({ challenge }));
	if (wasSolved) {
		return false;
	}

	const shouldCheckExpiration = typeof internal.expirationAfter === "number";

	// actual verification
	const isValid = await verifySolution(
		data,
		internal.hmacKey,
		shouldCheckExpiration,
	);

	// record, that challenge was solved
	await internal.storage.insertAsync({ challenge });

	return isValid;
};

const parse = (p) => {
	try {
		const dataStr = atob(p);
		return JSON.parse(dataStr);
	} catch (e) {
		return null;
	}
};
