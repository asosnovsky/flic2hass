import { HAmqtt } from "../ha_mqtt/index";
import { makeLogger } from "../Logger";
import { FlicMQTT } from "../mqtt_client/index";
import { IRConstants, NODE_ID, getConstants, makeOptions } from "./utils";
import { registerEntities, registerSelect } from "./entity_controller";
import { irMQTTHandler as handleMqttIREvents } from "./mqtt_handler";
import { handleIREvents } from "./ir_handler";
import { makeIRSharedState } from "./state";

export const startIRController = (
  ha: HAmqtt,
  mqtt: FlicMQTT,
  _options: Partial<IRControllerOpt> = {},
) => {
  const options = makeOptions(_options);
  const logger = makeLogger("ir", options.debug);
  const haDevice: HADevice = {
    name: "IR",
    manufacturer: "Flic",
    model: `${NODE_ID}${options.uniqueId}`,
    identifiers: ["FlicHubIR"],
    configuration_url: "https://hubsdk.flic.io/",
  };
  const constants: IRConstants = getConstants(ha, options);
  const nodeId = constants.NODE_ID;

  const state = makeIRSharedState(logger);

  logger.info("starting...");
  logger.debug("setting up entities...");
  registerEntities(ha, haDevice, constants);
  registerSelect(ha, haDevice, state, constants);
  logger.debug("setting default states....");
  ha.publishState(nodeId, constants.RECORD_SIGNAL.objectId, "OFF");
  ha.publishState(nodeId, constants.PLAY_SIGNAL.objectId, "OFF");
  logger.debug("registering events");
  handleMqttIREvents(
    mqtt,
    ha,
    nodeId,
    logger,
    state,
    constants,
    (onDone: () => void) =>
      registerSelect(ha, haDevice, state, constants, onDone),
  );
  handleIREvents(ha, logger, nodeId, state, constants, (onDone: () => void) =>
    registerSelect(ha, haDevice, state, constants, onDone),
  );
  logger.debug("subscribing to", constants.set_topics);
  mqtt.subscribe(constants.set_topics.map((x) => x.mqttPrefix));
  logger.info("is up");
};
