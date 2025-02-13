<a name="jkuester_altcha"></a>

## jkuester:altcha
Easy Meteor integration for altcha. For client integration
please look at he altcha documentation at https://altcha.org.

**See**: https://altcha.org  
**Example**  
```js
import { Meteor } from 'meteor/meteor';
import * as Altcha from 'meteor/jkuester:altcha'

Meteor.startup(() => {
  Altcha.init()
});

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

* [jkuester:altcha](#jkuester_altcha)
    * [.init(debug, storage)](#jkuester_altcha.init)
    * [.validate(payload)](#jkuester_altcha.validate) ⇒ <code>Promise.&lt;boolean&gt;</code>

<a name="jkuester_altcha.init"></a>

### jkuester:altcha.init(debug, storage)
Initializes the internals:
- set debug handler (optional)
- set storage Collection
- ensure environment (crypto)
- setup the endpoint

**Kind**: static method of [<code>jkuester:altcha</code>](#jkuester_altcha)  

| Param |
| --- |
| debug | 
| storage | 

<a name="jkuester_altcha.validate"></a>

### jkuester:altcha.validate(payload) ⇒ <code>Promise.&lt;boolean&gt;</code>
Validates the given payload for a requested challenge.
Checks, whether a challenge has already been in use
and aborts respectively (mitigate replay attack).

**Kind**: static method of [<code>jkuester:altcha</code>](#jkuester_altcha)  

| Param | Type | Description |
| --- | --- | --- |
| payload | <code>string</code> | the exact payload, returned from the form |

