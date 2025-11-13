import buttonModule, { Button } from "buttons";
import { HAmqtt } from "../ha_mqtt/index";
import { Logger } from "../Logger";
import { genButtonUniqueId, getDeviceFromButton } from "./utils";
import { ENTITIES } from "./entities";

export const ButtonStateHandler = (ha: HAmqtt, logger: Logger) => {
  const registerButton = (button: Button) => {
    logger.info("Registering", JSON.stringify(button, null, 4));
    const haDevice = getDeviceFromButton(button);
    const uniqId = genButtonUniqueId(button.bdaddr);
    ha.startLifeLine("Button Controller Connected", uniqId, haDevice);
    Object.keys(ENTITIES).forEach((objectId) => {
      let avl: any = {
        availability: [
          {
            payload_available: "ON",
            payload_not_available: "unavailable",
            topic: ha.genFlicPrefix(genButtonUniqueId(button.bdaddr), "ready"),
          },
          {
            payload_available: "ON",
            payload_not_available: "unavailable",
            topic: ha.genFlicPrefix(
              genButtonUniqueId(button.bdaddr),
              "lifeline",
            ),
          },
        ],
        availability_mode: "all",
      };
      if (objectId === "ready" || objectId == "connected") {
        avl.availability = [avl.availability[1]];
      }
      if (ENTITIES[objectId][0] === "device_automation") {
        avl = {};
      }
      ha.registerEntity(
        `Button ${objectId}`,
        ENTITIES[objectId][0],
        uniqId,
        objectId,
        haDevice,
        {
          ...ENTITIES[objectId][1],
          ...avl,
        },
      );
    });
  };
  const deregisterButton = (bdaddr: string) => {
    const uniqId = genButtonUniqueId(bdaddr);
    logger.info("Deregistering", JSON.stringify({ bdaddr, uniqId }, null, 4));
    Object.keys(ENTITIES).forEach((objectId) => {
      ha.deregisterEntity(ENTITIES[objectId][0], uniqId, objectId);
    });
  };
  const publishButtonState = (
    bdaddr: string,
    state: "released" | "pressed",
  ) => {
    logger.debug(`Updating state for bdaddr="${bdaddr}" state=${state}`);
    ha.publishState(genButtonUniqueId(bdaddr), "state", state);
  };
  const publishButtonAction = (
    bdaddr: string,
    state: "click" | "double_click" | "hold" | "none",
  ) => {
    const uniqId = genButtonUniqueId(bdaddr);
    ha.publishState(uniqId, "action", state);
    logger.debug(
      `Publishing click for bdaddr="${bdaddr}" uniqId="${uniqId}" state=${state}`,
    );
    if (state === "click") {
      ha.publishState(uniqId, "button_short_press", "ON");
    } else if (state === "double_click") {
      ha.publishState(uniqId, "button_double_press", "ON");
    } else if (state === "hold") {
      ha.publishState(uniqId, "button_long_press", "ON");
    }
  };
  const publishButtonMeta = (bdaddr: string) => {
    const button = buttonModule.getButton(bdaddr);
    const uniqId = genButtonUniqueId(button.bdaddr);
    ha.publishState(uniqId, "name", button.name);
    ha.publishState(uniqId, "battery", button.batteryStatus);
    ha.publishState(uniqId, "connected", button.connected ? "ON" : "OFF");
    ha.publishState(uniqId, "ready", button.ready ? "ON" : "OFF");
    ha.publishState(
      uniqId,
      "activeDisconnect",
      button.activeDisconnect ? "ON" : "OFF",
    );
    ha.publishState(uniqId, "passive", button.activeDisconnect ? "ON" : "OFF");
    ha.publishState(uniqId, "lifeline", "ON");
  };
  const handleBtnCreation = (eventName: string, obj: { bdaddr: string }) => {
    const button = buttonModule.getButton(obj.bdaddr);
    logger.info(
      eventName,
      "upserting",
      button.name,
      genButtonUniqueId(button.bdaddr),
    );
    registerButton(button);
  };
  return {
    addBtn: (eventName: string) => (o: { bdaddr: string }) =>
      handleBtnCreation(eventName, o),
    addBtnWithObject: (eventName: string) => (o: { button: Button }) =>
      handleBtnCreation(eventName, o.button),
    publishButtonMeta,
    publishButtonAction,
    publishButtonState,
    registerButton,
    deregisterButton,
  };
};
