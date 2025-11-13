import hubinfo from "hubinfo";
import { HAmqtt } from "../ha_mqtt/index";

const NODE_ID = "FlicHub";

export const makeOptions = (opt: Partial<FlicHubOptions>): FlicHubOptions => ({
  debug: false,
  uniqueId: "0",
  ...opt,
});
export const getHADevice = (options: FlicHubOptions): HADevice => ({
  name: `FlicHub (${options.uniqueId})`,
  manufacturer: "Flic",
  model: `${NODE_ID}${options.uniqueId}`,
  identifiers: ["FlicHub"],
  configuration_url: "https://hubsdk.flic.io/",
  sw_version: hubinfo.firmwareVersion,
  serial_number: hubinfo.serialNumber,
});
export type FlicHubConstants = ReturnType<typeof getConstants>;
export type FlicHubConstantsNames = keyof FlicHubConstants;
export const getConstants = (ha: HAmqtt, options: FlicHubOptions) => {
  const nodeId = `${NODE_ID}${options.uniqueId}`;
  return {
    NODE_ID: nodeId,
    LIFELINE_SGINAL: ha.genFlicPrefixObject(nodeId, "lifeline"),
    MESSAGE: ha.genFlicPrefixObject(nodeId, "action-message"),
    COMMAND_TOPIC: (virtualId: string) =>
      ha.genFlicPrefixObject(nodeId, `virt-command-${virtualId}`),
  };
};
