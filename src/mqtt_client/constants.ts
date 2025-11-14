/** 'private' constants */
export const C = {
  PROTOCOL_LEVEL: 4, // MQTT protocol level
  DEF_PORT: 1883, // MQTT default server port
  DEF_KEEP_ALIVE: 60, // Default keep_alive (s)
  DEF_QOS: 0, // Default QOS level
  CONNECT_TIMEOUT: 10000, // Time (ms) to wait for CONNACK
  PING_INTERVAL: 40, // Server ping interval (s)
};

/** Control packet types */
export const TYPE = {
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
  DISCONNECT: 14,
};

/**
 Return Codes
 http://docs.oasis-open.org/mqtt/mqtt/v3.1.1/os/mqtt-v3.1.1-os.html#_Toc385349256
 **/
export const RETURN_CODES: Record<number, string> = {
  0: "ACCEPTED",
  1: "UNACCEPTABLE_PROTOCOL_VERSION",
  2: "IDENTIFIER_REJECTED",
  3: "SERVER_UNAVAILABLE",
  4: "BAD_USER_NAME_OR_PASSWORD",
  5: "NOT_AUTHORIZED",
};
