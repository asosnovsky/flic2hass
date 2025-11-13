import { Button } from "buttons";
import { HADevice } from "../ha_mqtt/index";

export const getDeviceFromButton = (button: Button): HADevice => {
  return {
    name: button.name,
    identifiers: [button.serialNumber, button.uuid],
    manufacturer: "Flic",
    model: `v${button.flicVersion}_${button.color.trim().length > 0 ? button.color : "white"}`,
    sw_version: String(button.firmwareVersion),
    hw_version: String(button.flicVersion),
    serial_number: String(button.serialNumber),
    configuration_url: "https://hubsdk.flic.io/",
  };
};
export const genButtonUniqueId = (bdaddr: string): string =>
  bdaddr.replace(/:/g, "_");
