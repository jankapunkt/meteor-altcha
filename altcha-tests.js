import { Meteor } from "meteor/meteor";
import { Random } from "meteor/random";
import { expect } from "chai";
import { init, validate } from "meteor/jkuester:altcha";
import { solveChallenge } from "altcha-lib";
import { Worker } from "node:worker_threads";

global.Worker = Worker;

const base64 = (obj) => btoa(JSON.stringify(obj));
const { challengeUrl, algorithm, maxNumber } = Meteor.settings.altcha;
const asyncTimeout = (ms) =>
	new Promise((resolve) => {
		setTimeout(() => resolve(), ms);
	});
const getChallenge = () => {
	/*
   returns
   {
     algorithm: Algorithm;
     challenge: string;
     maxnumber?: number;
     salt: string;
     signature: string;
   }
   */
	return fetch(Meteor.absoluteUrl(challengeUrl), {
		method: "GET",
	}).then((res) => res.json());
};

const getPayload = async (data) => {
	const solution = await solveChallenge(
		data.challenge,
		data.salt,
		data.algorithm,
		data.maxNumber,
	).promise;
	return base64({
		algorithm: data.algorithm,
		challenge: data.challenge,
		number: solution.number,
		salt: data.salt,
		signature: data.signature,
		test: true,
		took: solution.took,
	});
};

const createAltchaPayload = (data, solution) => {
	return btoa(
		JSON.stringify({
			algorithm: data.algorithm,
			challenge: data.challenge,
			number: solution.number,
			salt: data.salt,
			signature: data.signature,
			test: test ? true : undefined,
			took: solution.took,
		}),
	);
};

describe("altcha", () => {
	let storage;

	before(() => {
		storage = new Mongo.Collection(null);
		const debug = process.env.DEBUG ? console.debug : undefined;
		init({ storage, debug });
	});

	it("returns a challenge from settings-configured endpoint", async () => {
		const data = await getChallenge();
		expect(data.algorithm).to.equal(algorithm);
		expect(data.maxnumber).to.equal(maxNumber);
		expect(data.challenge).to.be.a("string");
		expect(data.salt).to.be.a("string");
		expect(data.signature).to.be.a("string");
	});

	it("returns a different challenge on each request", async () => {
		const data1 = await getChallenge();
		const data2 = await getChallenge();

		expect(data1.challenge).to.not.equal(data2.challenge);
		expect(data1.salt).to.not.equal(data2.salt);
		expect(data1.signature).to.not.equal(data2.signature);
	});

	it("denies a clearly invalid payload", async () => {
		const payloads = [
			undefined,
			null,
			[],
			() => {},
			{},
			1,
			true,
			"",
			Random.id(),
			base64({}),
		];
		for (const payload of payloads) {
			const isValid = await validate(payload);
			expect(isValid).to.equal(false);
		}
	});

	it("denies a fake payload", async () => {
		for (let i = 0; i < 100; i++) {
			const payload = base64({
				challenge: Random.secret(),
				salt: Random.id(12),
				signature: Random.secret(),
				number: 1000,
				algorithm,
			});
			const isValid = await validate(payload);
			expect(isValid).to.equal(false);
		}
	});

	it("accepts a correct payload", async () => {
		const data = await getChallenge();
		const payload = await getPayload(data);
		const isValid = await validate(payload);
		expect(isValid).to.equal(true);
	});

	it("denies a replay of a correct payload", async () => {
		const data = await getChallenge();
		const payload = await getPayload(data);
		const isValid = await validate(payload);
		expect(isValid).to.equal(true);
		expect(await validate(payload)).to.equal(false);
		expect(await validate(payload)).to.equal(false);
		expect(await validate(payload)).to.equal(false);
	});

	it("denies an expired payload", async () => {
		const data = await getChallenge();
		const payload = await getPayload(data);
		await asyncTimeout(Meteor.settings.altcha.expirationAfter + 100);
		const isValid = await validate(payload);
		expect(isValid).to.equal(false);
	});
});
