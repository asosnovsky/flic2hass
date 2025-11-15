import ir from "ir";
import { Logger } from "../Logger";
import { IRConstants, convertUint32Array2Str } from "./utils";

import { HAmqtt } from "../ha_mqtt/index";
import { IRState } from "./state";

export const handleIREvents = (
  ha: HAmqtt,
  logger: Logger,
  nodeId: string,
  state: IRState,
  { RECORD_SIGNAL, RECORDED_SIGNALS }: IRConstants,
  reloadSelectableSignals: (onDone: () => void) => void,
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
    state.signalStore.add(stringMessage, (idx) => {
      reloadSelectableSignals(() => {
        ha.publishState(nodeId, RECORDED_SIGNALS.objectId, String(idx), {
          retain: true,
        });
      });
    });
    state.setRecordingState(false);
    ha.publishState(nodeId, RECORD_SIGNAL.objectId, "OFF");
  });
};
