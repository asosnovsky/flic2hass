import ir from "ir";
import { Logger } from "../Logger";
import { FlicMQTT } from "../mqtt_client/index";
import { IRConstants, convertStr2Uint32Array } from "./utils";
import { HAmqtt } from "../ha_mqtt/index";
import { IRState } from "./state";

export const irMQTTHandler = (
  mqtt: FlicMQTT,
  ha: HAmqtt,
  nodeId: string,
  logger: Logger,
  state: IRState,
  {
    RECORD_SIGNAL_SET,
    RECORDED_SIGNALS_CMD,
    PLAY_SIGNAL_SET,
    DELETE_SIGNAL_CMD,

    RECORD_SIGNAL,
  }: IRConstants,
  reloadSelectableSignals: (onDone: () => void) => void,
) => {
  logger.info(`Registering ir mqtt handler ${nodeId} `);
  mqtt.on("message", (topic, message) => {
    logger.info(
      "message:",
      JSON.stringify({
        topic,
        message,
        state,
      }),
    );
    if (topic === RECORD_SIGNAL_SET.mqttPrefix) {
      logger.info(`IR module is being set to ${message}`);
      if (!state.isRecording()) {
        ir.record();
        state.setRecordingState(true);
        logger.info(`Started recording...`);
        return;
      }
      if (message === "OFF" && state.isRecording()) {
        logger.info(`Attempting to stop recording...`);
        try {
          ir.cancelRecord();
          state.setRecordingState(false);
          logger.info(`Recording stopped!`);
          return;
        } catch (err) {
          logger.error(
            `Failed to stop record, check you have the latest version of the sdk!`,
          );
          state.setRecordingState(true);
          ha.publishState(nodeId, RECORD_SIGNAL.objectId, "OFF", {
            dup: false,
          });
          return;
        }
      }
      logger.info(`Doing nothing state.isRecording()=${state.isRecording()}`);
      return;
    }
    if (topic === RECORDED_SIGNALS_CMD.mqttPrefix) {
      logger.info(`Updating internal signal state to ${message}`);
      state.signalStore.setSelection(message, () => {});
      return;
    }
    if (topic === PLAY_SIGNAL_SET.mqttPrefix) {
      return state.signalStore.withData((signals, currentSelection) => {
        if (currentSelection === null) {
          logger.error(
            `currentSelection=${currentSelection} cannot be played!`,
          );
          return;
        }
        if (currentSelection >= signals.length) {
          logger.error(
            `currentSelection=${currentSelection} >= signals.length=${signals.length} cannot be played!`,
          );
          return;
        }
        const currentSignal = signals[currentSelection];
        let arr: Uint32Array | null = null;
        try {
          arr = convertStr2Uint32Array(currentSignal);
        } catch (err) {
          logger.error("invalid string signal set", JSON.stringify(err), err);
          return;
        }
        return ir.play(arr, (err) => {
          if (err) {
            logger.error("failed to play signal", JSON.stringify(err), err);
          } else {
            logger.debug("signal played!");
          }
        });
      });
    }
    if (topic === DELETE_SIGNAL_CMD.mqttPrefix) {
      return state.signalStore.removeCurrent(() =>
        reloadSelectableSignals(() =>
          logger.info(`Successfully removed Current Selection!`),
        ),
      );
    }
    logger.error(
      `Invalid topic recieved from mqtt ${JSON.stringify({ topic, message })}`,
    );
  });
};
