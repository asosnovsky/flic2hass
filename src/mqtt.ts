/* Copyright (c) 2013 Gordon Williams, Pur3 Ltd

------------------------------------------------------------------------------

All sections of code within this repository are licensed under an MIT License:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

-----------------------------------------------------------------------------

Modified by Flic Shortcut Labs.

*/

/** 'private' constants */
var C = {
  PROTOCOL_LEVEL: 4,  // MQTT protocol level
  DEF_PORT: 1883, // MQTT default server port
  DEF_KEEP_ALIVE: 60   // Default keep_alive (s)
};

/** Control packet types */
var TYPE = {
  CONNECT: 1,
  CONNACK: 2,
  PUBLISH: 3,
  PUBACK: 4,
  PUBREC: 5,
  PUBREL: 6,
  PUBCOMP: 7,
  SUBSCRIBE: 8,
  SUBACK: 9,
  UNSUBSCRIBE: 10,
  UNSUBACK: 11,
  PINGREQ: 12,
  PINGRESP: 13,
  DISCONNECT: 14
};

var pakId = Math.floor(Math.random() * 65534);

Uint8Array.prototype.charCodeAt = function (a, b) {
  return this.toString().charCodeAt(a, b);
}

/**
 Return Codes
 http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Toc385349256
 **/
var RETURN_CODES = {
  0: 'ACCEPTED',
  1: 'UNACCEPTABLE_PROTOCOL_VERSION',
  2: 'IDENTIFIER_REJECTED',
  3: 'SERVER_UNAVAILABLE',
  4: 'BAD_USER_NAME_OR_PASSWORD',
  5: 'NOT_AUTHORIZED'
};

/** MQTT constructor */
function MQTT(server, options) {
  this.server = server;
  options = options || {};
  this.port = options.port || C.DEF_PORT;
  this.client_id = options.client_id || mqttUid();
  this.keep_alive = options.keep_alive || C.DEF_KEEP_ALIVE;
  this.clean_session = options.clean_session || true;
  this.username = options.username;
  this.password = options.password;
  this.client = false;
  this.connected = false;
  /* if keep_alive is less than the ping interval we need to use
    a shorter ping interval, otherwise we'll just time out! */
  this.ping_interval =
    this.keep_alive < this.C.PING_INTERVAL ? (this.keep_alive - 5) : this.C.PING_INTERVAL;
  this.protocol_name = options.protocol_name || "MQTT";
  this.protocol_level = (options.protocol_level || C.PROTOCOL_LEVEL);

  if (typeof this.client_id == 'string') {
    var payloadarray = [this.client_id.length >> 8, this.client_id.length & 255];
    var i = 2;
    var messagearray = this.client_id.split('');
    for (var j = 0; j < this.client_id.length; j++) {
      var char = messagearray[j];
      var numberrepres = char.charCodeAt(0);
      payloadarray[i] = numberrepres;
      i = i + 1;
    }
    this.client_id = payloadarray;
  }
  if (this.password) {
    var payloadarray = [this.password.length >> 8, this.password.length & 255];
    var i = 2;
    var messagearray = this.password.split('');
    for (var j = 0; j < this.password.length; j++) {
      var char = messagearray[j];
      var numberrepres = char.charCodeAt(0);
      payloadarray[i] = numberrepres;
      i = i + 1;
    }
    this.password = payloadarray;
  }
  if (this.username) {
    var payloadarray = [this.username.length >> 8, this.username.length & 255];
    var i = 2;
    var messagearray = this.username.split('');
    for (var j = 0; j < this.username.length; j++) {
      var char = messagearray[j];
      var numberrepres = char.charCodeAt(0);
      payloadarray[i] = numberrepres;
      i = i + 1;
    }
    this.username = payloadarray;
  }
}

var __listeners = {};

Object.prototype.on = function (type, fn) {
  if (!__listeners[type]) {
    __listeners[type] = [];
  }
  __listeners[type].push(fn);
}

Object.prototype.emit = function (type, ...data) {
  if (__listeners[type]) {
    __listeners[type].map(function (fn) {
      fn(...data);
    });
  }
}

if (!Buffer.from) {
  Buffer.from = function (a) {
    return new Buffer(a);
  }
}

/** 'public' constants here */
MQTT.prototype.C = {
  DEF_QOS: 0,    // Default QOS level
  CONNECT_TIMEOUT: 10000, // Time (ms) to wait for CONNACK
  PING_INTERVAL: 40    // Server ping interval (s)
};

/* Utility functions ***************************/

var fromCharCode = String.fromCharCode;

/** MQTT string (length MSB, LSB + data) */
export function mqttStr(s) {
  var payloadarray = [s.length >> 8, s.length & 255];
  var i = 2;
  var messagearray = s.split('');
  for (var j = 0; j < s.length; j++) {
    var char = messagearray[j];
    var numberrepres = char.charCodeAt(0);
    payloadarray[i] = numberrepres;
    i = i + 1;
  }

  return payloadarray;
}

export function mqttInt2Str(arr: number[] | Uint8Array): string {
  let outStr = "";
  for (var i = 0; i < arr.length; i++) {
    outStr += createEscapedHex(arr[i])
  }
  return outStr
}

/** MQTT packet length formatter - algorithm from reference docs */
function mqttPacketLength(length) {
  var encLength = [];
  var i = 0;
  do {
    var encByte = length & 127;
    length = length >> 7;
    // if there are more data to encode, set the top bit of this byte
    if (length > 0) {
      encByte += 128;
    }
    encLength[i] = encByte;
    i++;
  } while (length > 0);
  return encLength;
}

/** MQTT packet length decoder - algorithm from reference docs */
function mqttPacketLengthDec(length) {
  var bytes = 0;
  var decL = 0;
  var lb = 0;
  do {
    lb = length[bytes];
    decL |= (lb & 127) << (bytes++ * 7);
  } while ((lb & 128) && (bytes < 4))
  return { "decLen": decL, "lenBy": bytes };
}

/** MQTT standard packet formatter */
function mqttPacket(cmd, variable, payload) {
  var cmdAndLengthArray = [cmd].concat(mqttPacketLength(variable.length + payload.length));
  var headerAndPayloadArray = cmdAndLengthArray.concat(variable).concat(payload);
  var messageBuffer = Buffer.from(headerAndPayloadArray);
  return messageBuffer;
}

/** Generate random UID */
var mqttUid = (function () {
  function s4() {
    var numberstring = Math.floor((1 + Math.random() * 10));
    if (numberstring == 10) numberstring = 9;
    numberstring = 97 + numberstring;
    return numberstring;
  }

  return function () {
    var output = [0, 12, s4(), s4(), s4(), s4(), s4(), s4(), s4(), s4(), s4(), s4(), s4(), s4()];
    return output;
  };
})();

/** Generate PID */
function mqttPid() {
  pakId = pakId > 65534 ? 1 : ++pakId;
  return [pakId >> 8, pakId & 0xFF];
}

/** Get PID from message */
function getPid(data) {
  return data.slice(0, 2);
}

/** PUBLISH control packet */
function mqttPublish(topic, message, qos, flags) {
  var cmd = TYPE.PUBLISH << 4 | (qos << 1) | flags;
  var variable = mqttStr(topic);
  // Packet id must be included for QOS > 0
  if (qos > 0) {
    var newvariable = variable.concat(mqttPid());
    return mqttPacket(cmd, newvariable, message);
  } else {
    return mqttPacket(cmd, variable, message);
  }
}

/** SUBSCRIBE control packet */
function mqttSubscribe(topic, qos) {
  var cmd = TYPE.SUBSCRIBE << 4 | 2;
  var payloadarray = [];
  var i = 0;
  var messagearray = topic.split('');
  for (var j = 0; j < topic.length; j++) {
    var char = messagearray[j];
    var numberrepres = char.charCodeAt(0);
    payloadarray[i] = numberrepres;
    i = i + 1;
  }
  return mqttPacket(cmd,
    mqttPid(),
    mqttStr(topic).concat([qos]));
}

/** UNSUBSCRIBE control packet */
function mqttUnsubscribe(topic) {
  var cmd = TYPE.UNSUBSCRIBE << 4 | 2;
  return mqttPacket(cmd,
    mqttPid(),
    mqttStr(topic));
}

/** Create escaped hex value from number */
function createEscapedHex(n: number): string {
  return fromCharCode(parseInt(n.toString(16), 16));
}

// Handle a single packet of data
MQTT.prototype.packetHandler = function (data) {

  // if we had some data left over from last
  // time, add it on
  if (this.partData && this.partData.length > 0) {
    data = Buffer.from(Array.prototype.slice.call(this.partData).concat(Array.prototype.slice.call(data)));
    this.partData = [];
  }

  // Figure out packet length...
  var dLen = mqttPacketLengthDec(data.slice(1, data.length));
  var pLen = dLen.decLen + dLen.lenBy + 1;
  // less than one packet?
  if (data.length < pLen) {
    this.partData = data;
    return;
  }
  // Get the data for this packet
  var pData = data.slice(1 + dLen.lenBy, pLen);
  // more than one packet? re-emit it so we handle it later
  if (data.length > pLen) {
    this.client.emit('data', data.slice(pLen, data.length));
  }
  // Now handle this MQTT packet
  var cmd = data[0];
  var type = cmd >> 4;
  var flag = cmd & 15;
  if (type === TYPE.PUBLISH) {
    var qos = (cmd & 0x6) >> 1;
    var topic_len = pData[0] << 8 | pData[1];
    var msg_start = 2 + topic_len + (qos ? 2 : 0);
    var parsedData = {
      topic: pData.slice(2, 2 + topic_len),
      message: pData.slice(msg_start, pData.length),
      dup: (cmd & 0x8) >> 3,
      qos: qos,
      pid: qos ? pData.slice(2 + topic_len, 4 + topic_len) : 0,
      retain: cmd & 0x1
    };
    if (parsedData.qos) {
      this.client.write([((parsedData.qos == 1) ? TYPE.PUBACK : TYPE.PUBREC) << 4, 2, parsedData.pid]);
    }
    this.emit('publish', parsedData);
    this.emit('message', mqttInt2Str(parsedData.topic), mqttInt2Str(parsedData.message));
  } else if (type === TYPE.PUBACK) {
    this.emit('puback', data.charCodeAt(2) << 8 | data.charCodeAt(3));
  } else if (type === TYPE.PUBREC) {
    var pubrelArray = [(TYPE.PUBREL << 4 | 2), 2];
    var pidArray = Array.prototype.slice.call(getPid(pData));
    var pubrecResponse = pubrelArray.concat(pidArray);
    this.client.write(Buffer.from(pubrecResponse));
  } else if (type === TYPE.PUBREL) {
    var pubcompArray = [(TYPE.PUBCOMP << 4), 2];
    var pidArray = Array.prototype.slice.call(getPid(pData));
    var pubrelResponse = pubcompArray.concat(pidArray);
    this.client.write(pubrelResponse);
  } else if (type === TYPE.PUBCOMP) {
    this.emit('pubcomp', data.charCodeAt(2) << 8 | data.charCodeAt(3));
  } else if (type === TYPE.SUBACK) {
    if (pData.length > 0) {
      if (pData[pData.length - 1] == 0x80) {
        this.emit('subscribed_fail');
      } else {
        this.emit('subscribed');
      }
    }
  } else if (type === TYPE.UNSUBACK) {
    this.emit('unsubscribed');
  } else if (type === TYPE.PINGREQ) {
    this.client.write([(TYPE.PINGRESP << 4), 0]);
  } else if (type === TYPE.PINGRESP) {
    this.emit('ping_reply');
  } else if (type === TYPE.CONNACK) {
    if (this.ctimo) clearTimeout(this.ctimo);
    this.ctimo = undefined;
    this.partData = [];
    var returnCode = pData[1];
    if (RETURN_CODES[returnCode] === 'ACCEPTED') {
      this.connected = true;
      // start pinging
      if (this.pintr) clearInterval(this.pintr);
      this.pintr = setInterval(this.ping.bind(this), this.ping_interval * 1000);
      // emit connected events
      this.emit('connected');
      this.emit('connect');
    } else {
      var mqttError = "Connection refused, ";
      this.connected = false;
      if (returnCode > 0 && returnCode < 6) {
        mqttError += RETURN_CODES[returnCode];
      } else {
        mqttError += "unknown return code: " + returnCode + ".";
      }
      this.emit('error', mqttError);
    }
  } else {
    this.emit('error', "MQTT unsupported packet type: " + type);
  }
};

/* Public interface ****************************/

/** Establish connection and set up keep_alive ping */
MQTT.prototype.connect = function (client) {
  if (this.connected) return;
  var mqo = this;
  var onConnect = function () {
    mqo.client = client;
    // write connection message
    var teststring = mqo.mqttConnect(mqo.client_id)
    client.write(teststring);
    // handle connection timeout if too slow
    mqo.ctimo = setTimeout(function () {
      mqo.ctimo = undefined;
      mqo.emit('disconnected');
      mqo.disconnect();
    }, mqo.C.CONNECT_TIMEOUT);
    // Incoming data
    client.on('data', mqo.packetHandler.bind(mqo));
    // Socket closed
    client.on('end', function () {
      mqo._scktClosed();
    });
  };
  if (client) {
    onConnect();
  } else {
    try {
      var self = this;
      client = require("net").Socket().connect({ host: mqo.server, port: mqo.port }, onConnect);
      client.on('error', function (err) {
        self.emit('error', err.message);
      });
    } catch (e) {
      this.client = false;
      this.emit('error', e.message);
    }
  }
};

/** Called internally when the connection closes  */
MQTT.prototype._scktClosed = function () {
  if (this.connected) {
    this.connected = false;
    this.client = false;
    if (this.pintr) clearInterval(this.pintr);
    if (this.ctimo) clearTimeout(this.ctimo);
    this.pintr = this.ctimo = undefined;
    this.emit('disconnected');
    this.emit('close');
  }
};

/** Disconnect from server */
MQTT.prototype.disconnect = function () {
  if (!this.client) return;
  try {
    this.client.write(Buffer.from([(TYPE.DISCONNECT << 4), 0]));
  } catch (e) {
    return this._scktClosed();
  }
  this.client.end();
  this.client = false;
};

/** Publish message using specified topic.
  opts = {
    retain: bool // the server should retain this message and send it out again to new subscribers
    dup : bool   // indicate the message is a duplicate because original wasn't ACKed (QoS > 0 only)
  }
*/
MQTT.prototype.publish = function (topic, message, opts) {
  if (!this.client) return;
  opts = opts || {};
  try {
    var payloadarray = [];
    var i = 0;
    var messagearray = message.split('');
    for (var j = 0; j < message.length; j++) {
      var char = messagearray[j];
      var numberrepres = char.charCodeAt(0);
      payloadarray[i] = numberrepres;
      i = i + 1;
    }
    var publishMessage = mqttPublish(topic, payloadarray, opts.qos || this.C.DEF_QOS, (opts.retain ? 1 : 0) | (opts.dup ? 8 : 0));
    this.client.write(publishMessage);
  } catch (e) {
    this._scktClosed();
  }
};

/** Subscribe to topic (filter) */
MQTT.prototype.subscribe = function (topics, opts) {
  if (!this.client) return;
  opts = opts || {};

  var subs = [];
  if ('string' === typeof topics) {
    topics = [topics];
  }
  if (Array.isArray(topics)) {
    topics.forEach(function (topic) {
      subs.push({
        topic: topic,
        qos: opts.qos || this.C.DEF_QOS
      });
    }.bind(this));
  } else {
    Object
      .keys(topics)
      .forEach(function (k) {
        subs.push({
          topic: k,
          qos: topics[k]
        });
      });
  }

  subs.forEach(function (sub) {
    var subpacket = mqttSubscribe(sub.topic, sub.qos);
    this.client.write(subpacket);
  }.bind(this));
};

/** Unsubscribe to topic (filter) */
MQTT.prototype.unsubscribe = function (topic) {
  if (!this.client) return;
  this.client.write(mqttUnsubscribe(topic));
};

/** Send ping request to server */
MQTT.prototype.ping = function () {
  if (!this.client) return;
  try {
    this.client.write(Buffer.from([TYPE.PINGREQ << 4, 0]));
  } catch (e) {
    this._scktClosed();
  }
};

/* Packet specific functions *******************/

/** Create connection flags */
MQTT.prototype.createFlagsForConnection = function (options) {
  var flags = 0;
  flags |= (this.username) ? 0x80 : 0;
  flags |= (this.username && this.password) ? 0x40 : 0;
  flags |= (options.clean_session) ? 0x02 : 0;
  return flags;
};

/** CONNECT control packet
 Clean Session and Userid/Password are currently only supported
 connect flag. Wills are not
 currently supported.
 */
MQTT.prototype.mqttConnect = function (clean) {
  var cmd = TYPE.CONNECT << 4;
  var flags = this.createFlagsForConnection({
    clean_session: clean
  });

  var keep_alive = [this.keep_alive >> 8, this.keep_alive & 255];

  /* payload */
  var payload = this.client_id;
  if (this.username) {
    payload = payload.concat(this.username);
    if (this.password) {
      payload = payload.concat(this.password);
    }
  }
  return mqttPacket(cmd,
    mqttStr(this.protocol_name)/*protocol name*/.concat(
      [this.protocol_level]) /*protocol level*/.concat(
        [flags]).concat(keep_alive),
    payload);
};

/* Exports *************************************/

/** This is 'exported' so it can be used with `require('MQTT.js').create(server, options)` */
export function create(server, options): MQTT {
  return new MQTT(server, options);
};

export function connect(options): MQTT {
  var mqtt = new MQTT(options.host, options);
  mqtt.connect();
  return mqtt;
};


export interface MQTT {
  connect(): void;
  publish(topic: string, message: string, opts: {
    retain?: boolean, // the server should retain this message and send it out again to new subscribers
    dup?: boolean,   // indicate the message is a duplicate because original wasn't ACKed (QoS > 0 only)
  } | undefined): void;
  subscribe(topics: string[]): void;
  unsubscribe(topic: string): void;
  on(ev: 'publish', cb: (data: { topic: Buffer, message: Buffer }) => void): void;
  on(ev: 'message', cb: (topic: string, message: string) => void): void;
  on(ev: 'puback', cb: (data) => void): void;
  on(ev: 'pubcomp', cb: (data) => void): void;
  on(ev: 'subscribed_fail', cb: (data) => void): void;
  on(ev: 'subscribed', cb: (data) => void): void;
  on(ev: 'unsubscribed', cb: (data) => void): void;
  on(ev: 'ping_reply', cb: (data) => void): void;
  on(ev: 'connected', cb: (data) => void): void;
  on(ev: 'connect', cb: (data) => void): void;
  on(ev: 'error', cb: (data) => void): void;
  on(ev: 'disconnected', cb: (data) => void): void;
  on(ev: 'close', cb: (data) => void): void;
};
