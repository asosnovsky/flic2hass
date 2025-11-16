import buttonModule, { Button } from "buttons";
import { Logger } from "../Logger";
import {
  ButtonConstants,
  deregisterButton,
  genButtonUniqueId,
  getConstants,
  registerEntities,
} from "./utils";
import { HAmqtt } from "../ha_mqtt/index";

export const createHandleBtnCreation =
  (ha: HAmqtt, logger: Logger) =>
  (eventName: string) =>
  (button: Button): ButtonConstants => {
    logger.info(
      eventName,
      "upserting",
      button.name,
      genButtonUniqueId(button.bdaddr),
    );
    const constants = registerEntities(ha, button, logger);
    publishButtonMeta(ha, button, constants, logger);
    return constants;
  };

const publishButtonMeta = (
  ha: HAmqtt,
  button: Button,
  constants: ButtonConstants,
  logger: Logger,
): ButtonConstants => {
  logger.debug(`Publishing Button Metadata ${JSON.stringify(button)}`);
  ha.publishStateFromObject(constants.states.BATTERY, button.batteryStatus);
  ha.publishStateFromObject(
    constants.signals.CONNECTED,
    button.connected ? "ON" : "OFF",
  );
  ha.publishStateFromObject(
    constants.signals.READY,
    button.ready ? "ON" : "OFF",
  );
  ha.publishStateFromObject(
    constants.states.ACTIVE_DISCONNECT,
    button.activeDisconnect ? "ON" : "OFF",
  );
  return constants;
};

export const publishButtonMetaByBdaddr = (
  ha: HAmqtt,
  bdaddr: string,
  logger: Logger,
): ButtonConstants | null => {
  const button = buttonModule.getButton(bdaddr);
  if (!button) {
    logger.error(`Cannot publish metadata for ${{ bdaddr }}`);
    return null;
  }
  const constants = getConstants(ha, bdaddr);
  return publishButtonMeta(ha, button, constants, logger);
};

const publishButtonAction = (
  ha: HAmqtt,
  logger: Logger,
  constants: ButtonConstants,
  state: "click" | "double_click" | "hold" | "none",
) => {
  ha.publishStateFromObject(constants.states.ACTION, state);
  logger.debug(
    `Publishing click for uniqId="${constants.uniqId}" state=${state}`,
  );
  if (state === "click") {
    ha.publishStateFromObject(
      constants.actions.SHORT_PRESS,
      constants.actions.SHORT_PRESS.objectId,
    );
  } else if (state === "double_click") {
    ha.publishStateFromObject(
      constants.actions.DOUBLE_PRESS,
      constants.actions.DOUBLE_PRESS.objectId,
    );
  } else if (state === "hold") {
    ha.publishStateFromObject(
      constants.actions.LONG_PRESS,
      constants.actions.LONG_PRESS.objectId,
    );
  }
};
export const setListeners = (ha: HAmqtt, logger: Logger) => {
  const resetActiontInv: Record<string, any> = {};
  const handleButtonCreation = createHandleBtnCreation(ha, logger);
  buttonModule.on("buttonAdded", (btn) =>
    handleButtonCreation("buttonAdded")(btn.button),
  );
  buttonModule.on("buttonUpdated", (btn) =>
    handleButtonCreation("buttonUpdated")(btn.button),
  );
  buttonModule.on("buttonDeleted", ({ bdaddr }) => {
    deregisterButton(ha, bdaddr, logger);
    if (resetActiontInv[bdaddr]) {
      clearTimeout(resetActiontInv[bdaddr]);
      resetActiontInv[bdaddr] = null;
    }
  });
  buttonModule.on("buttonConnected", ({ bdaddr }) => {
    const btn = buttonModule.getButton(bdaddr);
    if (btn) {
      handleButtonCreation("buttonConnected")(btn);
    }
  });
  buttonModule.on("buttonReady", ({ bdaddr }) => {
    const btn = buttonModule.getButton(bdaddr);
    if (btn) {
      const constants = handleButtonCreation("buttonReady")(btn);
      ha.publishStateFromObject(constants.states.STATE, "released");
      publishButtonAction(ha, logger, constants, "none");
    }
  });
  buttonModule.on("buttonDisconnected", ({ bdaddr }) => {
    if (resetActiontInv[bdaddr]) {
      clearTimeout(resetActiontInv[bdaddr]);
      resetActiontInv[bdaddr] = null;
    }
    publishButtonMetaByBdaddr(ha, bdaddr, logger);
  });
  buttonModule.on("buttonDown", ({ bdaddr }) => {
    const constants = publishButtonMetaByBdaddr(ha, bdaddr, logger);
    if (constants) {
      ha.publishStateFromObject(constants.states.STATE, "pressed");
    }
  });
  buttonModule.on("buttonUp", ({ bdaddr }) => {
    const constants = publishButtonMetaByBdaddr(ha, bdaddr, logger);
    if (constants) {
      ha.publishStateFromObject(constants.states.STATE, "released");
    }
  });
  buttonModule.on("buttonSingleOrDoubleClickOrHold", (obj) => {
    const constants = publishButtonMetaByBdaddr(ha, obj.bdaddr, logger);
    if (constants) {
      if (resetActiontInv[obj.bdaddr]) {
        clearTimeout(resetActiontInv[obj.bdaddr]);
        resetActiontInv[obj.bdaddr] = null;
      }
      publishButtonAction(
        ha,
        logger,
        constants,
        obj.isSingleClick
          ? "click"
          : obj.isDoubleClick
            ? "double_click"
            : "hold",
      );
      resetActiontInv[obj.bdaddr] = setTimeout(() => {
        publishButtonAction(ha, logger, constants, "none");
      }, 750);
    }
  });
};
