import { C, TYPE } from "./constants";

/** Generate random UID */
export const mqttUid = (function () {
  function s4() {
    var numberstring = Math.floor(1 + Math.random() * 10);
    if (numberstring == 10) numberstring = 9;
    numberstring = 97 + numberstring;
    return numberstring;
  }

  return function () {
    var output = [
      0,
      12,
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
      s4(),
    ];
    return output;
  };
})();
/** MQTT string (length MSB, LSB + data) */
export const mqttStr = (s: string) => {
  var payloadarray = [s.length >> 8, s.length & 255];
  var i = 2;
  var messagearray = s.split("");
  for (var j = 0; j < s.length; j++) {
    var char = messagearray[j];
    var numberrepres = char.charCodeAt(0);
    payloadarray[i] = numberrepres;
    i = i + 1;
  }
  return payloadarray;
};
export const getClientId = (options: MQTTOptions): number[] => {
  if (typeof options.client_id == "string") {
    return mqttStr(options.client_id);
  }
  return options.client_id;
};
export const setOptionDefaults = (
  options: Partial<MQTTOptions>,
): MQTTOptions => ({
  port: options.port || C.DEF_PORT,
  client_id: options.client_id || mqttUid(),
  keep_alive: options.keep_alive || C.DEF_KEEP_ALIVE,
  clean_session: options.clean_session || true,
  username: options.username,
  password: options.password,
  protocol_name: options.protocol_name || "MQTT",
  protocol_level: options.protocol_level || C.PROTOCOL_LEVEL,
});

/** MQTT packet length formatter - algorithm from reference docs */
export const mqttPacketLength = (length: number) => {
  var encLength: number[] = [];
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
};

/** MQTT packet length decoder - algorithm from reference docs */
export type MqttPacketLengthDec = { decLen: number; lenBy: number };
export const mqttPacketLengthDec = (
  length: number[] | Buffer,
): MqttPacketLengthDec => {
  var bytes = 0;
  var decL = 0;
  var lb = 0;
  do {
    lb = length[bytes];
    decL |= (lb & 127) << (bytes++ * 7);
  } while (lb & 128 && bytes < 4);
  return { decLen: decL, lenBy: bytes };
};

export const createBufferFromArray = (a: number[]) => {
  if (Buffer.from) {
    return Buffer.from(a);
  } else {
    return new Buffer(a);
  }
};

/** MQTT standard packet formatter */
export const mqttPacket = (
  cmd: number,
  variable: number[],
  payload: number[],
) => {
  var cmdAndLengthArray = [cmd].concat(
    mqttPacketLength(variable.length + payload.length),
  );
  var headerAndPayloadArray = cmdAndLengthArray
    .concat(variable)
    .concat(payload);
  var messageBuffer = createBufferFromArray(headerAndPayloadArray);
  return messageBuffer;
};

/** Get PID from message */
export const getPid = (data: Buffer) => {
  return data.slice(0, 2);
};

/** PUBLISH control packet */
export const createMqttPublishPacket = (
  topic: string,
  message: number[],
  qos: number,
  flags: number,
  pid: number[],
) => {
  var cmd = (TYPE.PUBLISH << 4) | (qos << 1) | flags;
  var variable = mqttStr(topic);
  // Packet id must be included for QOS > 0
  if (qos > 0) {
    var newvariable = variable.concat(pid);
    return mqttPacket(cmd, newvariable, message);
  } else {
    return mqttPacket(cmd, variable, message);
  }
};

/** SUBSCRIBE control packet */
export const createMqttSubscribePacket = (
  topic: string,
  qos: number,
  pid: number[],
) => {
  var cmd = (TYPE.SUBSCRIBE << 4) | 2;
  var payloadarray = [];
  var i = 0;
  var messagearray = topic.split("");
  for (var j = 0; j < topic.length; j++) {
    var char = messagearray[j];
    var numberrepres = char.charCodeAt(0);
    payloadarray[i] = numberrepres;
    i = i + 1;
  }
  return mqttPacket(cmd, pid, mqttStr(topic).concat([qos]));
};
