import buttonModule from "buttons";
import { HAmqtt } from "../ha_mqtt/index";
import { makeLogger } from "../Logger";
import { makeOptions } from "./options";
import { ButtonStateHandler } from "./button_state_handler";

export type ButtonController = ReturnType<typeof makeButtonController>;
export function makeButtonController(
  ha: HAmqtt,
  options: Partial<ButtonControllerOpt> = {},
) {
  options = makeOptions(options);
  const logger = makeLogger("btnc", options.debug);
  logger.info(
    "Starting Flic ButtonController with",
    JSON.stringify(options, null, 4),
  );
  const stateHandler = ButtonStateHandler(ha, logger);
  const setListeners = () => {
    let resetActiontInv: null | any = null;
    buttonModule.on(
      "buttonAdded",
      stateHandler.addBtnWithObject("buttonAdded"),
    );
    buttonModule.on(
      "buttonUpdated",
      stateHandler.addBtnWithObject("buttonUpdated"),
    );
    buttonModule.on("buttonDeleted", (btn) => {
      logger.debug("buttonDeleted", JSON.stringify(btn, null, 4));
      stateHandler.deregisterButton(btn.bdaddr);
      stateHandler.publishButtonMeta(btn.bdaddr);
    });
    buttonModule.on("buttonConnected", stateHandler.addBtn("buttonConnected"));
    buttonModule.on("buttonReady", (btn) => {
      stateHandler.addBtn("buttonReady")(btn);
      stateHandler.publishButtonState(btn.bdaddr, "released");
      stateHandler.publishButtonAction(btn.bdaddr, "none");
    });
    buttonModule.on("buttonDisconnected", ({ bdaddr }) => {
      stateHandler.publishButtonMeta(bdaddr);
    });
    buttonModule.on("buttonDown", ({ bdaddr }) => {
      stateHandler.publishButtonState(bdaddr, "pressed");
      stateHandler.publishButtonMeta(bdaddr);
    });
    buttonModule.on("buttonUp", ({ bdaddr }) => {
      stateHandler.publishButtonState(bdaddr, "released");
      stateHandler.publishButtonMeta(bdaddr);
    });
    buttonModule.on("buttonClickOrHold", (obj) => {});
    buttonModule.on("buttonSingleOrDoubleClickOrHold", (obj) => {
      if (resetActiontInv !== null) {
        clearTimeout(resetActiontInv);
      }
      stateHandler.publishButtonAction(
        obj.bdaddr,
        obj.isSingleClick
          ? "click"
          : obj.isDoubleClick
            ? "double_click"
            : "hold",
      );
      stateHandler.publishButtonMeta(obj.bdaddr);
      resetActiontInv = setTimeout(() => {
        stateHandler.publishButtonAction(obj.bdaddr, "none");
      }, 500);
    });
  };
  const start = () => {
    logger.info("Starting...");
    logger.info("Setting listeners...");
    setListeners();
    logger.info("Registering all buttons...");
    buttonModule
      .getButtons()
      .forEach((btn) => stateHandler.registerButton(btn));
    setInterval(() => {
      logger.debug("Updating button state!");
      buttonModule
        .getButtons()
        .forEach((btn) => stateHandler.publishButtonMeta(btn.bdaddr));
    }, 3000);
    logger.info("is up");
  };

  return {
    start,
    publishButtonAction: stateHandler.publishButtonAction,
    publishButtonMeta: stateHandler.publishButtonMeta,
    publishButtonState: stateHandler.publishButtonState,
  };
}
