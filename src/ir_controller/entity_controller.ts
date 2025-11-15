import { HAmqtt } from "../ha_mqtt/index";
import { IRState } from "./state";
import { IRConstants } from "./utils";

export const registerEntities = (
  ha: HAmqtt,
  haDevice: HADevice,
  constants: IRConstants,
) => {
  const {
    NODE_ID,
    LIFELINE_SGINAL,
    RECORD_SIGNAL,
    RECORD_SIGNAL_SET,
    PLAY_SIGNAL,
    PLAY_SIGNAL_SET,
    DELETE_SIGNAL,
    DELETE_SIGNAL_CMD,
    availability,
  } = constants;
  ha.startLifeLine(
    "IR Connnected",
    NODE_ID,
    haDevice,
    LIFELINE_SGINAL.objectId,
  );
  ha.registerEntity(
    "Record Signal",
    "switch",
    NODE_ID,
    RECORD_SIGNAL.objectId,
    haDevice,
    {
      icon: "mdi:record-rec",
      command_topic: RECORD_SIGNAL_SET.mqttPrefix,
      device_class: "switch",
      availability,
    },
  );
  ha.registerEntity(
    "Delete Signal",
    "button",
    NODE_ID,
    PLAY_SIGNAL.objectId,
    haDevice,
    {
      icon: "mdi:play",
      command_topic: PLAY_SIGNAL_SET.mqttPrefix,
      availability,
    },
  );
  ha.registerEntity(
    "Delete Signal",
    "button",
    NODE_ID,
    DELETE_SIGNAL.objectId,
    haDevice,
    {
      icon: "mdi:delete",
      command_topic: DELETE_SIGNAL_CMD.mqttPrefix,
      availability,
    },
  );
};

export const registerSelect = (
  ha: HAmqtt,
  haDevice: HADevice,
  state: IRState,
  { NODE_ID, RECORD_SIGNAL, RECORDED_SIGNALS_CMD, availability }: IRConstants,
  onDone: () => void = () => {},
) => {
  state.signalStore.withDataIndexed((data) => {
    ha.registerEntity(
      "Recorded Signals",
      "select",
      NODE_ID,
      RECORD_SIGNAL.objectId,
      haDevice,
      {
        command_topic: RECORDED_SIGNALS_CMD.mqttPrefix,
        icon: "mdi:broadcast",
        max: 500,
        availability,
        options: data.map(({ name }) => String(name)),
      },
    );
    onDone();
  });
};
