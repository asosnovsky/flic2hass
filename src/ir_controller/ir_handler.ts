import ir from "ir";
import { Logger } from "../Logger";
import {
  IRConstants,
  IRState,
  convertStr2Uint32Array,
  convertUint32Array2Str,
} from "./utils";
import { HAmqtt } from "../ha_mqtt/index";

export const handleIREvents = (
  ha: HAmqtt,
  logger: Logger,
  nodeId: string,
  state: IRState,
  { VALUE_SIGNAL_STATE, RECORD_SIGNAL }: IRConstants,
) => {
  ir.on("recordComplete", (data) => {
    logger.info("recordComplete", data);
    if (data.length === 0) {
      logger.error("Failed to record any data");
      return;
    }
    const stringMessage = convertUint32Array2Str(data);
    logger.info(
      "recording completed with",
      JSON.stringify({
        stringMessage,
      }),
    );
    state.setCurrentSignal(stringMessage);
    ha.publishState(nodeId, VALUE_SIGNAL_STATE.objectId, stringMessage, {
      retain: true,
    });
    state.setRecordingState(false);
    ha.publishState(nodeId, RECORD_SIGNAL.objectId, "OFF");
  });
};
