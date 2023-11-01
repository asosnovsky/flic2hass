# flic2hass

A Flic SDK utility to publish all of your Flic buttons to Home Assistant via MQTT as well control the onboard IR module.

Requirements:

* A Flic Hub
* A functional MQTT server

## Basic Steps

**1. Connect to Flic Hub IDE:**

* Follow along with the beginning of [these instructions](https://hubsdk.flic.io/static/tutorial/) to enable SDK access.
* Go to: <https://hubsdk.flic.io/> and login, your hub should be discovered automatically.

**2. Create `MQTT` module:**

* One in the Web IDE, click "Create Module".
* Give the new module a name. "`MQTT`" is a good option but anything will work.

**3. Insert `lib.js`:**

* Copy content from `lib.js` in this repo to lib.js in the flic IDE.
* Right click the folder in the left pane and select "New File".
* Name the file `lib.js` (IT MUST BE NAMED THIS).
* Copy content from `lib.js` in this repo to lib.js in the flic IDE.

**4. Setup `main.js`:**

* Copy the following to `main.js`

```js
require("./lib").start(
 require("buttons"),
 require("ir"),
 "0",
 {
  mqtt: {
   host: "set-this-to-yours",
   username: "set-this-to-yours",
   password: "set-this-to-yours",
  }
 }
)
```

* Modify `host`, `username`, `password` with your details.

   *If your MQTT server does not require authentication:*

* Delete `username` & `password`:

1. Start the module in the IDE by clicking the green play button, and watch the Console output (it's extremely verbose right now)

   *If the module didn't start correctly, try powercycling your Flic Hub and reconnect. Verify the Module saved properly and is running.*

2. Once the module has started and you have verified it is working as expected, turn on the "restart after crash" checkbox to ensure the module is always running after any unexpected crash or hub power cycle.

## Additional Configuration

The setup example contains just the bare minimum changes, if you wish to play around with the configuration or need to enable expanded logging see the following complete configuration file.

```jsonc
{
   "mqtt": {
      "host": "", // MQTT Host
      "port": 1883, // MQTT Port
      "client_id": "", // MQTT Identifier
      "username": "", // MQTT Username
      "password": "" // MQTT Password
   },
   "debug": false, // Enable debug logging for all modules
   "ha": {
      "debug": false, // Enable debug logging for just home-assistant related things
      "topics": {
         "homeassistant": "homeassistant", // MQTT Prefix for homeassistant auto-discover
         "flic": "flic", // MQTT Prefix for state values
      }
   },
   "flicBtns": { 
      "disabled": false, // Do not publish button events
      "debug": false // Enable debug logging for button related things
   },
   "flicIR": { 
      "disabled": false, // Do not publish IR events
      "debug": false // Enable debug logging for IR related things
   },
}
```
