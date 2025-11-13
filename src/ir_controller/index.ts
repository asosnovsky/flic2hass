import ir from "ir";

import { HAmqtt } from "../ha_mqtt/index";
import { makeLogger } from "../Logger";
import { MQTT } from "../mqtt";
import {
  NODE_ID,
  convertStr2Uint32Array,
  convertUint32Array2Str,
  makeOptions,
} from "./utils";

export const makeIRController = (
  ha: HAmqtt,
  mqtt: MQTT,
  options: Partial<IRControllerOpt> = {},
) => {
  options = makeOptions(options);
  const logger = makeLogger("ir", options.debug);
  const haDevice: HADevice = {
    name: "IR",
    manufacturer: "Flic",
    model: `${NODE_ID}${options.uniqueId}`,
    identifiers: ["FlicHubIR"],
    configuration_url: "https://hubsdk.flic.io/",
  };
  const nodeId = `${NODE_ID}${options.uniqueId}`;
  const LIFELINE_SGINAL = ha.genFlicPrefix(nodeId, "lifeline");
  const RECORD_SIGNAL_SET = ha.genFlicPrefix(nodeId, "record/set");
  const VALUE_SIGNAL_SET = ha.genFlicPrefix(nodeId, "signal/set");
  const VALUE_SIGNAL_STATE = ha.genFlicPrefix(nodeId, "signal");
  const PLAY_SIGNAL_SET = ha.genFlicPrefix(nodeId, "play/set");
  const availability = [
    {
      payload_available: "ON",
      payload_not_available: "unavailable",
      topic: LIFELINE_SGINAL,
    },
  ];
  let currentSignal: string | null = null;

  const set_topics = [
    RECORD_SIGNAL_SET,
    VALUE_SIGNAL_SET,
    PLAY_SIGNAL_SET,
    VALUE_SIGNAL_STATE,
  ];

  return {
    start() {
      logger.info("starting...");
      logger.debug("setting up entities...");
      ha.startLifeLine("IR Connnected", nodeId, haDevice);
      ha.registerEntity(
        "IR Available",
        "binary_sensor",
        nodeId,
        "lifeline",
        haDevice,
        {
          device_class: "connectivity",
          expire_after: 5,
          off_delay: 3,
          entity_category: "diagnostic",
          payload_available: "ON",
          payload_not_available: "OFF",
        },
      );
      ha.registerEntity("Record Signal", "switch", nodeId, "record", haDevice, {
        icon: "mdi:record-rec",
        command_topic: RECORD_SIGNAL_SET,
        device_class: "switch",
        availability,
      });
      ha.registerEntity("Signal", "text", nodeId, "signal", haDevice, {
        command_topic: VALUE_SIGNAL_SET,
        icon: "mdi:broadcast",
        max: 255,
        availability,
      });
      ha.registerEntity("Play Signal", "button", nodeId, "play", haDevice, {
        icon: "mdi:play",
        command_topic: PLAY_SIGNAL_SET,
        availability,
      });
      logger.debug("setting default states....");
      ha.publishState(nodeId, "record", "OFF");
      ha.publishState(nodeId, "play", "OFF");
      logger.debug("registering events");
      mqtt.on("message", (topic, message) => {
        logger.debug("message:", JSON.stringify({ topic, message }));
        if (topic === RECORD_SIGNAL_SET) {
          logger.debug("starting record");
          ir.record();
          ha.publishState(nodeId, "record", "ON");
        } else if (topic === PLAY_SIGNAL_SET) {
          if (currentSignal !== null) {
            logger.info("playing", currentSignal);
            let arr: Uint32Array | null = null;
            try {
              arr = convertStr2Uint32Array(currentSignal);
            } catch (err) {
              logger.error(
                "invalid string signal set",
                JSON.stringify(err),
                err,
              );
              return;
            }
            ir.play(arr, (err) => {
              if (err) {
                logger.error("failed to play signal", JSON.stringify(err), err);
              } else {
                logger.debug("signal played!");
              }
            });
          } else {
            logger.error("cannot play an unset signal");
          }
        } else if (topic === VALUE_SIGNAL_STATE) {
          currentSignal = message;
          logger.info("setting currentSignal", currentSignal);
        } else if (topic === VALUE_SIGNAL_SET) {
          ha.publishState(nodeId, "signal", message, { retain: true });
        }
      });
      ir.on("recordComplete", (data) => {
        const stringMessage = convertUint32Array2Str(data);
        logger.debug(
          "recording completed with",
          JSON.stringify({
            data,
            stringMessage,
            rev: convertStr2Uint32Array(stringMessage),
          }),
        );
        if (stringMessage.length > 255) {
          logger.error(
            "stringMessage is too big! size=",
            stringMessage.length,
            "max=255",
          );
        }
        ha.publishState(nodeId, "signal", stringMessage, { retain: true });
        ha.publishState(nodeId, "record", "OFF");
      });

      logger.debug("subscribing to", set_topics);
      mqtt.subscribe(set_topics);
      logger.info("is up");
    },
  };
};
