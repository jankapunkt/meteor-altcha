# Meteor Altcha

[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)

Easy Meteor integration for [Altcha](https://altcha.org). Works with any frontend.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Installation](#installation)
  - [Settings setup](#settings-setup)
  - [Server setup](#server-setup)
  - [Client Setup](#client-setup)
  - [Service Worker considerations](#service-worker-considerations)
- [Form submission and validation](#form-submission-and-validation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

First, add this package via `meteor add jkuester:altcha`

Then install Altcha via `npm install --save altcha altcha-lib`.
They are installed manually because you will otherwise not benefit from automated security
audits, such as dependabot etc.

### Settings setup

For increased security, the internals are configured via Meteor.settings.
If you haven't created a Meteor settings file then you can do it via

```shell
echo "{}" > settings.json
```

So you can start your Meteor app using the settings via `meteor --settings=settings.json`.

An example settings for altha may look like he following:

```json
{
  "public": {
    "altcha": {
      "challengeUrl": "/altcha-challenge"
    }
  },
  "altcha": {
    "algorithm": "SHA-256",
    "challengeUrl": "/altcha-challenge",
    "hmacKey": "01234567890abcdefghijklmnopqrstuvwxyz",
    "maxNumber": 1000000,
    "expirationAfter": 300000
  }
}
```

The public part is only needed if you want to configure the challenge url
via settings.

### Server setup

Now you need to initialize it on the server. You can optionally pass a
Mongo.Collection as storage for solved challenges (prevent Replay Attacks) or a name of the collection
or omit to use an in-memory collection:

```js
import { Meteor } from 'meteor/meteor';
import * as Altcha from 'meteor/jkuester:altcha';

Meteor.startup(() => {
  Altcha.init()
});
```

As you can see there is an optional debug param, which
you can pass a function to, so the internal is passed to it.
Beware to disable it in production, though.

### Client Setup

On your client you can simply follow the altcha integration guide.

The most minimal setup is to use the altcha component and only
configure the challenge-url. The following is a Blaze example,
but you are free to use any frontend!

```handlebars
<template name="myForm">
    <form id="myForm">
        <input type="text" name="username" placeholder="Username" />
        <altcha-widget challengeurl="{{settings.altcha.challengeUrl}}" debug></altcha-widget>
        <button type="submit">Submit</button>
    </form>
</template>
```

```js
import { Template } from 'meteor/templating';
import './myForm.html';
import 'altcha'; // this is the npm package, not the Meteor package!

Template.registerHelper('settings', () => Meteor.settings.public)

Template.myForm.events({
  'submit #myForm' (event) {
    event.preventDefault()

    const data = Object.fromEntries(new FormData(event.target).entries())

    // see next section
    Meteor.call('validateForm', data, (err, res) => {
      if (err) {
        alert(err.message)
      }
      else {
        event.target.reset()
      }
    })
  },
});
```

### Service Worker considerations

If you're using a service worker then you should make
sure, it ignores the challenge url.

Otherwise, aggressive caching might cause forms to reuse
existing challenges which in turn are rejected by
default when validating.

## Form submission and validation

In the above example we now validate the submitted form
by sending the data to a Meteor Method endpoint.

For the above example, the endpoint simply looks like this:

```js
Meteor.methods({
  async validateForm ({ username, altcha }) {
    const isValid = await Altcha.validate(altcha);
    if (!isValid) {
      throw new Meteor.Error(403, 'challenge failed')
    }
    // challenge passed, you can
    // continue with the form submission
    // data processing
  }
})
```

The default field name for the altcha is `altcha` and
you should consider this in your schema, if you do Methods-
validation using a schema, like SimpleSchema, zod, etc.

## API Documentation

The API is documented in a separate [API.md file](./API.md).

## Contribution

Thank you for considering to contribute! To make both our time worth the effort,
please get familiar with the [contribution guide](./CONTRIBUTING.md), the [security guide](./SECURITY.md) and 
the [code of conduct](./CODE_OF_CONDUCT.md).

## License

MIT, see [license file](./LICENSE).
