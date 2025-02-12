import { Meteor } from "meteor/meteor";
import { webcrypto } from "node:crypto";
import { Mongo } from "meteor/mongo";
import { WebApp } from "meteor/webapp";
import { createChallenge, verifySolution } from "altcha-lib";

export const Altcha = {};

const settings = Meteor.settings.altcha;
const internal = {
  algorithm: settings.algorithm, // SHA-1, SHA-256, SHA-512, default: SHA-256
	hmacKey: settings.hmacKey,
	maxNumber: settings.maxNumber,
	expirationAfter: settings.expirationAfter,
	storage: null,
  challengeUrl: settings.challengeUrl
};

Altcha.init = ({ storage } = {}) => {
	// XXX: apply fix for Node 16
	// see https://github.com/altcha-org/altcha-lib?tab=readme-ov-file#usage-with-nodejs-16
	if (typeof globalThis.crypto === "undefined") {
		globalThis.crypto = webcrypto;
	}

	// the default storage is in-memory
	// but users can define their own
	Altcha.storage(
		isCollection(storage)
			? storage
			: new Mongo.Collection(typeof storage === "string" ? storage : null),
	);

  WebApp.handlers.get( internal.challengeUrl, async (req, res) => {
    const expires = new Date()
    expires.setTime(expires.getTime() + internal.expirationAfter)
    const challenge = await createChallenge({
      algorithm: internal.algorithm,
      hmacKey: internal.hmacKey,
      maxNumber: 100000,
      expires
    });
    res.status(200).send(challenge);
  })
};

Altcha.validate = async (payload, hmacKey, checkExpires) => {
  return verifySolution(payload, hmacKey, checkExpires)
}

Altcha.storage = (collection) => {
	if (collection instanceof Mongo.Collection) {
		internal.storage = collection;
	}
	return internal.storage;
};



const isCollection = (c) => c instanceof Mongo.Collection;
