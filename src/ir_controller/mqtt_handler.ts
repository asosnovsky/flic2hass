import ir from "ir";
import { Logger } from "../Logger";
import { FlicMQTT } from "../mqtt_client/index";
import { IRConstants, IRState, convertStr2Uint32Array } from "./utils";
import { HAmqtt } from "../ha_mqtt/index";

export const irMQTTHandler = (
  mqtt: FlicMQTT,
  ha: HAmqtt,
  nodeId: string,
  logger: Logger,
  state: IRState,
  { RECORD_SIGNAL_SET, VALUE_SIGNAL_SET, RECORD_SIGNAL }: IRConstants,
) => {
  logger.info(`Registering ir mqtt handler ${nodeId} ${state.currentSignal()}`);
  mqtt.on("message", (topic, message) => {
    logger.info(
      "message:",
      JSON.stringify({
        topic,
        message,
        state,
        currentSignal: state.currentSignal(),
      }),
    );
    if (topic === VALUE_SIGNAL_SET.mqttPrefix) {
      state.setCurrentSignal(message);
      logger.info("setting currentSignal", message);
    } else if (topic === RECORD_SIGNAL_SET.mqttPrefix) {
      logger.info(`IR module is being set to ${message}`);
      if (message === "OFF" && state.isRecording()) {
        try {
          ir.cancelRecord();
          state.setRecordingState(false);
        } catch (err) {
          logger.error(
            `Failed to stop record, check you have the latest version of the sdk!`,
          );
          state.setRecordingState(true);
          ha.publishState(nodeId, RECORD_SIGNAL.objectId, "OFF", {
            dup: false,
          });
        }
      } else if (!state.isRecording()) {
        ir.record();
        state.setRecordingState(true);
      } else {
        logger.info(
          `Doing nothing state.isRecording()=${state.isRecording()} state.currentSignal()=${state.currentSignal()}`,
        );
      }
    }
  });
};
