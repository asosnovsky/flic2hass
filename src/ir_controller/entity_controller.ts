import { HAmqtt } from "../ha_mqtt/index";
import { IRConstants } from "./utils";

export const registerEntities = (
  ha: HAmqtt,
  haDevice: HADevice,
  {
    NODE_ID,
    LIFELINE_SGINAL,
    RECORD_SIGNAL,
    RECORD_SIGNAL_SET,
    VALUE_SIGNAL_SET,
    VALUE_SIGNAL_STATE,
    PLAY_SIGNAL,
    PLAY_SIGNAL_SET,
  }: IRConstants,
) => {
  const availability = [
    {
      payload_available: "ON",
      payload_not_available: "unavailable",
      topic: LIFELINE_SGINAL.mqttPrefix,
    },
  ];
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
    "Signal",
    "text",
    NODE_ID,
    VALUE_SIGNAL_STATE.objectId,
    haDevice,
    {
      command_topic: VALUE_SIGNAL_SET.mqttPrefix,
      icon: "mdi:broadcast",
      max: 255,
      availability,
    },
  );
  ha.registerEntity(
    "Play Signal",
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
};
