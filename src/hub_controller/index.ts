import { HAmqtt } from "../ha_mqtt/index";
import { makeLogger } from "../Logger";
import { MQTT } from "../mqtt";
import flichub from "flicapp";
import {
  makeOptions,
  getHADevice,
  getConstants,
  FlicHubConstants,
} from "./utils";
import { virtualDeviceUpdateHandler } from "./virtual_device_update";

export const startFlicHubController = (
  ha: HAmqtt,
  mqtt: MQTT,
  _options: Partial<FlicHubOptions> = {},
) => {
  const options = makeOptions(_options);
  const logger = makeLogger("flichub", options.debug);
  const haDevice = getHADevice(options);
  const constants: FlicHubConstants = getConstants(ha, options);
  const availability = [
    {
      payload_available: "ON",
      payload_not_available: "unavailable",
      topic: constants.LIFELINE_SGINAL.mqttPrefix,
    },
  ];

  logger.info("starting...");
  logger.debug("setting up entities...");
  ha.startLifeLine(
    "FlicHub Connected",
    constants.NODE_ID,
    haDevice,
    constants.LIFELINE_SGINAL.objectId,
  );
  ha.registerEntity(
    "Action Message",
    "sensor",
    constants.NODE_ID,
    constants.MESSAGE.objectId,
    haDevice,
    {
      icon: "mdi:message",
      availability,
    },
  );
  ha.publishState(constants.NODE_ID, constants.MESSAGE.objectId, "");

  flichub.on("actionMessage", (obj) => {
    ha.publishState(constants.NODE_ID, constants.MESSAGE.objectId, obj);
  });
  flichub.on("virtualDeviceUpdate", (update) =>
    virtualDeviceUpdateHandler(
      ha,
      logger,
      haDevice,
      constants.NODE_ID,
      update,
      constants.COMMAND_TOPIC(update.metaData.virtualDeviceId),
      availability,
    ),
  );
};
