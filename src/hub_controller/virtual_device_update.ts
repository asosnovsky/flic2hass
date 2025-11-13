import {
  VirtualDeviceMetaData,
  VirtualDeviceType,
  VirtualDeviceUpdate,
} from "flicapp";
import { HAmqtt } from "../ha_mqtt/index";
import { Logger } from "../Logger";

const genVirtualDeviceObjectId = ({
  virtualDeviceId,
  dimmableType,
}: VirtualDeviceMetaData) =>
  `virt-${dimmableType}-${virtualDeviceId}`.toLowerCase();

const VirtualDeviceType2HAComponent: Record<VirtualDeviceType, HAComponent> = {
  Blind: "cover",
  Light: "light",
  Speaker: "media_player",
};

const convertStateUpdate2HA = (update: VirtualDeviceUpdate) => {
  if (update.metaData.dimmableType === "Light") {
    if (update.values.brightness) {
      return {
        brightness: Math.floor(update.values.brightness * 255),
        state: update.values.brightness > 0 ? "ON" : "OFF",
      };
    }
    if (update.values.colorTemperature) {
      return {
        color_temp: Math.floor(update.values.colorTemperature * 255),
      };
    }
  }
  throw new Error(`${update} is not supported at the moment!`);
};
export const virtualDeviceUpdateHandler = (
  ha: HAmqtt,
  logger: Logger,
  haDevice: HADevice,
  nodeId: string,
  update: VirtualDeviceUpdate,
  commandTopic: FlicMqttPrefix,
  availability: any,
) => {
  const objectId = genVirtualDeviceObjectId(update.metaData);
  const mqttPrefix = ha.genFlicPrefixObject(nodeId, objectId);
  logger.info(`Handling update for ${update} on ${haDevice}`);
  ha.registerEntity(
    update.metaData.virtualDeviceId,
    VirtualDeviceType2HAComponent[update.metaData.dimmableType],
    mqttPrefix.nodeId,
    mqttPrefix.objectId,
    haDevice,
    { availability, command_topic: commandTopic },
  );
  ha.publishState(mqttPrefix.nodeId, mqttPrefix.objectId, {
    brightness: update.values.brightness * 255,
  });
};
