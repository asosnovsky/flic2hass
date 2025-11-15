import { HAmqtt } from "../ha_mqtt/index";

export const NODE_ID = "FlicHubIR";
export const convertUint32Array2Str = (arr: Uint32Array): string => {
  let outStr = [];
  for (let i = 0; i < arr.length; i++) {
    outStr.push(arr[i].toString(32));
  }
  return outStr.join("_");
};
export const convertStr2Uint32Array = (s: string): Uint32Array => {
  const a = s.split("_");
  return new Uint32Array(a.slice(0, a.length - 2).map((v) => parseInt(v, 32)));
};

export const makeOptions = (
  opt: Partial<IRControllerOpt>,
): IRControllerOpt => ({
  debug: false,
  uniqueId: "0",
  ...opt,
});

export type IRConstants = ReturnType<typeof getConstants>;
export type IRConstantsNames = keyof IRConstants;
export const getConstants = (ha: HAmqtt, options: IRControllerOpt) => {
  const nodeId = `${NODE_ID}${options.uniqueId}`;
  const LIFELINE_SGINAL = ha.genFlicPrefixObject(nodeId, "lifeline");
  const RECORD_SIGNAL = ha.genFlicPrefixObject(nodeId, "record");
  const RECORD_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "record/set");
  const PLAY_SIGNAL = ha.genFlicPrefixObject(nodeId, "play");
  const PLAY_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "play/set");
  const RECORDED_SIGNALS = ha.genFlicPrefixObject(nodeId, "rsignals");
  const RECORDED_SIGNALS_CMD = ha.genFlicPrefixObject(nodeId, "rsignals/cmd");
  const DELETE_SIGNAL = ha.genFlicPrefixObject(nodeId, "delsignals");
  const DELETE_SIGNAL_CMD = ha.genFlicPrefixObject(nodeId, "delsignals/cmd");
  const availability = [
    {
      payload_available: "ON",
      payload_not_available: "unavailable",
      topic: LIFELINE_SGINAL.mqttPrefix,
    },
  ];
  return {
    NODE_ID: nodeId,
    LIFELINE_SGINAL,
    RECORD_SIGNAL,
    RECORD_SIGNAL_SET,
    RECORDED_SIGNALS,
    RECORDED_SIGNALS_CMD,
    PLAY_SIGNAL,
    PLAY_SIGNAL_SET,
    DELETE_SIGNAL,
    DELETE_SIGNAL_CMD,
    set_topics: [
      RECORD_SIGNAL_SET,
      RECORDED_SIGNALS_CMD,
      PLAY_SIGNAL_SET,
      DELETE_SIGNAL_CMD,
    ],
    availability,
  };
};

const homeAutomationWords: string[] = [
  "home",
  "hub",
  "plug",
  "bulb",
  "lock",
  "door",
  "gate",
  "bell",
  "cam",
  "nest",
  "ring",
  "alex",
  "echo",
  "siri",
  "gove",
  "hue",
  "wemo",
  "sonos",
  "arlo",
  "wyze",
  "zigb",
  "zway",
  "mqtt",
  "node",
  "iftt",
  "zap",
  "temp",
  "heat",
  "cool",
  "fan",
  "vent",
  "ac",
  "wifi",
  "ble",
  "zwav",
  "lora",
  "mesh",
  "edge",
  "cloud",
  "api",
  "app",
  "ios",
  "droid",
  "voice",
  "tap",
  "swipe",
  "scene",
  "rule",
  "auto",
  "mode",
  "away",
  "sleep",
  "wake",
  "light",
  "dim",
  "on",
  "off",
  "toggle",
  "timer",
  "schedule",
  "sensor",
  "motion",
  "open",
  "close",
  "leak",
  "smoke",
  "co2",
  "air",
  "humid",
  "lux",
  "rgb",
  "cct",
  "tune",
  "group",
  "zone",
  "room",
  "floor",
  "alarm",
  "siren",
  "arm",
  "disarm",
  "panic",
  "geo",
  "fence",
  "dash",
  "widget",
  "ui",
  "theme",
  "dark",
  "log",
  "event",
  "alert",
  "push",
  "sms",
  "email",
  "web",
  "hook",
  "rest",
  "grpc",
  "mqtt",
];
export function generateSequence(
  n: number,
  words: string[] | null = null,
  sep: string = "-",
): string {
  words = words || homeAutomationWords;
  if (n <= 0) {
    return "";
  }
  const result: string[] = [];
  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * words.length);
    result.push(words[randomIndex]);
  }

  return result.join(sep);
}

export const generateRandomKeyNotInList = (l: string[]): string => {
  let name = generateSequence(5);
  while (l.indexOf(name) !== -1) {
    name = generateSequence(5);
  }
  return name;
};
