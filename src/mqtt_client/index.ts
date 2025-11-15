import net, { Socket } from "net";
import { C, RETURN_CODES, TYPE } from "./constants";
import {
  mqttStr,
  getClientId,
  setOptionDefaults,
  mqttPacketLengthDec,
  mqttPacket,
  createBufferFromArray,
  getPid,
  createMqttPublishPacket,
  createMqttSubscribePacket,
} from "./utils";
export type ParsedMQTTData = {
  topic: string;
  message: string;
  dup: number;
  qos: number;
  pid: number | Buffer;
  retain: number;
};
type MQTTEventMapping = {
  error: (err: string) => void;
  disconnected: () => void;
  connected: () => void;
  connect: () => void;
  close: () => void;
  end: () => void;
  data: (d: number[]) => void;
  publish: (d: ParsedMQTTData) => void;
  message: (
    topic: ParsedMQTTData["topic"],
    message: ParsedMQTTData["message"],
  ) => void;
  puback: (n: number) => void;
  pubcomp: (n: number) => void;
  subscribed_fail: () => void;
  subscribed: () => void;
  unsubscribed: () => void;
  ping_reply: () => void;
};
type MQTTEventName = keyof MQTTEventMapping;
type _Listener<T extends MQTTEventName> = MQTTEventMapping[T];
export class FlicMQTT {
  private options: MQTTOptions;
  private clientId: number[];
  private connected: boolean = false;
  private pingInterval: number;
  private username: number[] | null = null;
  private password: number[] | null = null;
  private client: Socket | null = null;
  private __listeners: Record<MQTTEventName, _Listener<any>[]> = {
    close: [],
    connected: [],
    connect: [],
    disconnected: [],
    end: [],
    error: [],
    data: [],
    publish: [],
    message: [],
    puback: [],
    pubcomp: [],
    subscribed: [],
    unsubscribed: [],
    subscribed_fail: [],
    ping_reply: [],
  };
  private pakId = Math.floor(Math.random() * 65534);

  public partData: number[] | Buffer = [];
  public ctimo: any | null = null;
  public pintr: any | null = null;

  constructor(
    private server: string,
    _options: Partial<MQTTOptions>,
  ) {
    this.options = setOptionDefaults(_options);
    this.clientId = getClientId(this.options);
    if (this.options.username) {
      this.username = mqttStr(this.options.username);
    }
    if (this.options.password) {
      this.password = mqttStr(this.options.password);
    }
    this.pingInterval =
      this.options.keep_alive < C.PING_INTERVAL
        ? this.options.keep_alive - 5
        : C.PING_INTERVAL;
  }

  isConnected() {
    return this.client !== null;
  }

  on<T extends MQTTEventName>(type: T, fn: _Listener<T>) {
    if (!this.__listeners[type]) {
      this.__listeners[type] = [];
    }
    this.__listeners[type].push(fn);
  }

  emit<T extends MQTTEventName>(type: T, ...data: Parameters<_Listener<T>>) {
    if (this.__listeners[type]) {
      this.__listeners[type].map(function (fn) {
        fn(...data);
      });
    }
  }

  mqttPid() {
    this.pakId = this.pakId > 65534 ? 1 : ++this.pakId;
    return [this.pakId >> 8, this.pakId & 0xff];
  }

  connect() {
    console.log(
      "Connecting..." +
        JSON.stringify({
          connected: this.connected,
        }),
    );
    if (this.connected) {
      return;
    }
    const mqo = this;
    try {
      const client = (this.client = net.createConnection(
        { host: this.server, port: this.options.port },
        () => {
          // write connection message
          const teststring = mqo.mqttConnect(!!mqo.clientId);
          client.write(teststring);
          // handle connection timeout if too slow
          mqo.ctimo = setTimeout(function () {
            mqo.ctimo = null;
            mqo.emit("disconnected");
            mqo.disconnect();
          }, C.CONNECT_TIMEOUT);
          // Incoming data
          const handler = mqo.packetHandler.bind(mqo);
          client.on("data", handler as any);
          // Socket closed
          client.on("end", function () {
            mqo._scktClosed();
          });
        },
      ));
    } catch (e) {
      this.client = null;
      this.emit("error", (e as Error).message);
    }
  }

  /** Called internally when the connection closes  */
  _scktClosed() {
    if (this.connected) {
      this.client = null;
      this.connected = false;
      if (this.pintr) clearInterval(this.pintr);
      if (this.ctimo) clearTimeout(this.ctimo);
      this.pintr = this.ctimo = undefined;
      this.emit("disconnected");
      this.emit("close");
    }
  }

  /** Disconnect from server */
  disconnect() {
    if (!this.client) return;
    try {
      this.client.write(createBufferFromArray([TYPE.DISCONNECT << 4, 0]));
    } catch (e) {
      return this._scktClosed();
    }
    this.client.end();
    this.client = null;
  }

  /** Create connection flags */
  createFlagsForConnection(clean: boolean) {
    var flags = 0;
    flags |= this.username ? 0x80 : 0;
    flags |= this.username && this.password ? 0x40 : 0;
    flags |= clean ? 0x02 : 0;
    return flags;
  }
  /** CONNECT control packet
   Clean Session and Userid/Password are currently only supported
   connect flag. Wills are not
   currently supported.
   */
  mqttConnect(clean: boolean) {
    var cmd = TYPE.CONNECT << 4;
    var flags = this.createFlagsForConnection(clean);

    var keep_alive = [
      this.options.keep_alive >> 8,
      this.options.keep_alive & 255,
    ];

    /* payload */
    var payload = this.clientId;
    if (this.username) {
      payload = payload.concat(this.username);
      if (this.password) {
        payload = payload.concat(this.password);
      }
    }
    return mqttPacket(
      cmd,
      mqttStr(this.options.protocol_name) /*protocol name*/
        .concat([this.options.protocol_level]) /*protocol level*/
        .concat([flags])
        .concat(keep_alive),
      payload,
    );
  }

  packetHandler(data: Buffer) {
    if (!this.client) {
      this.emit("error", "disconnected mid packet handling");
      throw new Error("disconnected mid packet handling");
    }
    // if we had some data left over from last
    // time, add it on
    if (this.partData && this.partData.length > 0) {
      data = createBufferFromArray(
        Array.prototype.slice
          .call(this.partData)
          .concat(Array.prototype.slice.call(data)),
      );
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

    // Handle this MQTT packet
    var cmd = data[0];
    var type = cmd >> 4;
    if (type === TYPE.PUBLISH) {
      var qos = (cmd & 0x6) >> 1;
      var topic_len = (pData[0] << 8) | pData[1];
      var msg_start = 2 + topic_len + (qos ? 2 : 0);
      var parsedData: ParsedMQTTData = {
        topic: pData.slice(2, 2 + topic_len).toString("utf8"),
        message: pData.slice(msg_start, pData.length).toString("utf8"),
        dup: (cmd & 0x8) >> 3,
        qos: qos,
        pid: qos ? pData.slice(2 + topic_len, 4 + topic_len) : 0,
        retain: cmd & 0x1,
      };
      if (parsedData.qos) {
        const _d = (parsedData.qos == 1 ? TYPE.PUBACK : TYPE.PUBREC) << 4;
        this.client.write([_d, 2, parsedData.pid] as any);
      }
      this.emit("publish", parsedData);
      this.emit("message", parsedData.topic, parsedData.message);
    } else if (type === TYPE.PUBACK) {
      this.emit(
        "puback",
        (data.toString().charCodeAt(2) << 8) | data.toString().charCodeAt(3),
      );
    } else if (type === TYPE.PUBREC) {
      var pubrelArray = [(TYPE.PUBREL << 4) | 2, 2];
      var pidArray = Array.prototype.slice.call(getPid(pData));
      var pubrecResponse = pubrelArray.concat(pidArray);
      this.client.write(Buffer.from(pubrecResponse));
    } else if (type === TYPE.PUBREL) {
      var pubcompArray = [TYPE.PUBCOMP << 4, 2];
      var pidArray = Array.prototype.slice.call(getPid(pData));
      var pubrelResponse = pubcompArray.concat(pidArray);
      this.client.write(pubrelResponse as any);
    } else if (type === TYPE.PUBCOMP) {
      this.emit(
        "pubcomp",
        (data.toString().charCodeAt(2) << 8) | data.toString().charCodeAt(3),
      );
    } else if (type === TYPE.SUBACK) {
      if (pData.length > 0) {
        if (pData[pData.length - 1] == 0x80) {
          this.emit("subscribed_fail");
        } else {
          this.emit("subscribed");
        }
      }
    } else if (type === TYPE.UNSUBACK) {
      this.emit("unsubscribed");
    } else if (type === TYPE.PINGREQ) {
      this.client.write([TYPE.PINGRESP << 4, 0] as any);
    } else if (type === TYPE.PINGRESP) {
      this.emit("ping_reply");
    } else if (type === TYPE.CONNACK) {
      if (this.ctimo) clearTimeout(this.ctimo);
      this.ctimo = undefined;
      this.partData = [];
      var returnCode = pData[1];
      if (RETURN_CODES[returnCode] === "ACCEPTED") {
        this.connected = true;
        // start pinging
        if (this.pintr) clearInterval(this.pintr);
        this.pintr = setInterval(
          this.ping.bind(this),
          this.pingInterval * 1000,
        );
        // emit connected events
        this.emit("connected");
        this.emit("connect");
      } else {
        var mqttError = "Connection refused, ";
        this.connected = false;
        if (returnCode > 0 && returnCode < 6) {
          mqttError += RETURN_CODES[returnCode];
        } else {
          mqttError += "unknown return code: " + returnCode + ".";
        }
        this.emit("error", mqttError);
      }
      // more than one packet? re-emit it so we handle it later
      if (data.length > pLen) {
        this.client.emit("data", data.slice(pLen, data.length));
      }
    } else {
      this.emit("error", "MQTT unsupported packet type: " + type);
    }
  }

  /** Unsubscribe to topic (filter) */
  unsubscribe(topic: string) {
    if (!this.client) return;
    var cmd = (TYPE.UNSUBSCRIBE << 4) | 2;
    this.client.write(mqttPacket(cmd, this.mqttPid(), mqttStr(topic)));
  }

  /** Send ping request to server */
  ping() {
    if (!this.client) return;
    try {
      this.client.write(Buffer.from([TYPE.PINGREQ << 4, 0]));
    } catch (e) {
      this._scktClosed();
    }
  }

  /** Publish message using specified topic.
    opts = {
      retain: bool // the server should retain this message and send it out again to new subscribers
      dup : bool   // indicate the message is a duplicate because original wasn't ACKed (QoS > 0 only)
    }
  */
  publish(topic: string, message: string, opts: MQTTPublishOpt) {
    if (!this.client) return;
    opts = opts || {};
    try {
      var payloadarray = [];
      var i = 0;
      var messagearray = message.split("");
      for (var j = 0; j < message.length; j++) {
        var char = messagearray[j];
        var numberrepres = char.charCodeAt(0);
        payloadarray[i] = numberrepres;
        i = i + 1;
      }
      var publishMessage = createMqttPublishPacket(
        topic,
        payloadarray,
        opts.qos || C.DEF_QOS,
        (opts.retain ? 1 : 0) | (opts.dup ? 8 : 0),
        this.mqttPid(),
      );
      this.client.write(publishMessage);
    } catch (e) {
      this._scktClosed();
    }
  }

  /** Subscribe to topic (filter) */
  subscribe(
    topics: string[] | string | Record<string, number>,
    opts: { qos?: number } = {},
  ) {
    if (!this.client) return;
    const client = this.client;
    const mqo = this;
    opts = opts || {};

    var subs: { topic: string; qos: number }[] = [];
    if ("string" === typeof topics) {
      topics = [topics];
    }
    if (Array.isArray(topics)) {
      topics.forEach((topic) => {
        subs.push({
          topic: topic,
          qos: opts.qos || C.DEF_QOS,
        });
      });
    } else {
      Object.keys(topics).forEach(function (k) {
        subs.push({
          topic: k,
          qos: (topics as any)[k],
        });
      });
    }
    subs.forEach((sub) => {
      var subpacket = createMqttSubscribePacket(
        sub.topic,
        sub.qos,
        mqo.mqttPid(),
      );
      client.write(subpacket);
    });
  }
}
