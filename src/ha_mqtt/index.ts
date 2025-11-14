import { makeLogger } from "../Logger";
import { FlicMQTT } from "../mqtt_client/index";
import { makeOptions } from "./utils";

export type HAmqtt = ReturnType<typeof makeHAmqtt>;
export function makeHAmqtt(
  mqttServer: FlicMQTT,
  _options: Partial<HAmqttOptions> = {},
) {
  const options = makeOptions(_options);
  const logger = makeLogger("mqtt:ha", options.debug);
  logger.info("starting...", JSON.stringify(options, null, 4));
  const genFlicPrefix = (nodeId: string, objectId: string): string => {
    return `${options.topics.flic}/${nodeId}/${objectId}`;
  };
  const genFlicPrefixObject = (
    nodeId: string,
    objectId: string,
  ): FlicMqttPrefix => ({
    nodeId,
    objectId,
    mqttPrefix: genFlicPrefix(nodeId, objectId),
  });

  const genHAPrefix = (
    component: HAComponent,
    nodeId: string,
    objectId: string,
  ) => {
    return `${options.topics.homeassistant}/${component}/${nodeId}/${objectId}`;
  };

  const publishState = (
    nodeId: string,
    objectId: string,
    state: any,
    opt: MQTTPublishOpt = {},
  ) => {
    const btntopic = genFlicPrefix(nodeId, objectId);
    mqttServer.publish(btntopic, state + "", opt);
    logger.debug(btntopic, state, JSON.stringify(opt));
  };
  const registerEntity = (
    name: string,
    component: HAComponent,
    nodeId: string,
    objectId: string,
    device: HADevice,
    additionalProps: {
      topic?: string;
      state_topic?: string;
    } & {
      [key: string]: any;
    } = {},
  ) => {
    const configtopic = genHAPrefix(component, nodeId, objectId) + "/config";
    if (component === "device_automation") {
      additionalProps.topic = genFlicPrefix(nodeId, objectId);
    } else {
      additionalProps.state_topic = genFlicPrefix(nodeId, objectId);
    }
    const configObj = {
      name,
      ...additionalProps,
      unique_id: `Flic_${nodeId}_${objectId}`,
      device,
    };
    mqttServer.publish(configtopic, JSON.stringify(configObj), {
      retain: true,
    });
    logger.debug(configtopic, JSON.stringify(configObj, null, 4));
  };

  const deregisterEntity = (
    component: HAComponent,
    nodeId: string,
    objectId: string,
  ) => {
    const configtopic = genHAPrefix(component, nodeId, objectId) + "/config";
    mqttServer.publish(configtopic, null, { retain: false });
    logger.debug(configtopic, null);
  };
  const startLifeLine = (
    name: string,
    nodeId: string,
    haDevice: HADevice,
    topic: string = "lifeline",
  ) => {
    registerEntity(name, "binary_sensor", nodeId, topic, haDevice, {
      device_class: "connectivity",
      expire_after: 5,
      off_delay: 3,
      entity_category: "diagnostic",
      payload_available: "ON",
      payload_not_available: "OFF",
    });
    setInterval(() => {
      publishState(nodeId, topic, "ON");
    }, 2500);
  };
  return {
    deregisterEntity,
    registerEntity,
    publishState,
    genFlicPrefix,
    genFlicPrefixObject,
    startLifeLine,
  };
}
