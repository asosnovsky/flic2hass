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

export type IRState = ReturnType<typeof makeIRSharedState>;
export const makeIRSharedState = () => {
  let currentSignal = "";
  let isRecording: boolean = false;
  return {
    isRecording() {
      return isRecording;
    },
    setRecordingState(newValue: boolean) {
      isRecording = newValue;
    },
    currentSignal() {
      return currentSignal;
    },
    setCurrentSignal(newValue: string) {
      currentSignal = newValue;
    },
  };
};

export type IRConstants = ReturnType<typeof getConstants>;
export type IRConstantsNames = keyof IRConstants;
export const getConstants = (ha: HAmqtt, options: IRControllerOpt) => {
  const nodeId = `${NODE_ID}${options.uniqueId}`;
  const LIFELINE_SGINAL = ha.genFlicPrefixObject(nodeId, "lifeline");
  const RECORD_SIGNAL = ha.genFlicPrefixObject(nodeId, "record");
  const RECORD_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "record/set");
  const VALUE_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "signal/set");
  const VALUE_SIGNAL_STATE = ha.genFlicPrefixObject(nodeId, "signal");
  const PLAY_SIGNAL = ha.genFlicPrefixObject(nodeId, "play");
  const PLAY_SIGNAL_SET = ha.genFlicPrefixObject(nodeId, "play/set");
  return {
    NODE_ID: nodeId,
    LIFELINE_SGINAL,
    RECORD_SIGNAL,
    RECORD_SIGNAL_SET,
    VALUE_SIGNAL_SET,
    VALUE_SIGNAL_STATE,
    PLAY_SIGNAL,
    PLAY_SIGNAL_SET,
    set_topics: [RECORD_SIGNAL_SET, VALUE_SIGNAL_SET, PLAY_SIGNAL_SET],
  };
};
