import { makeLogger } from "../Logger";
import { HAmqtt } from "../ha_mqtt/index";
import {
  createHandleBtnCreation,
  publishButtonMetaByBdaddr,
  setListeners,
} from "./button_module_handler";
import { makeOptions } from "./utils";
import buttonModule from "buttons";

export const startButtinStateHandler = (
  ha: HAmqtt,
  _options: Partial<ButtonControllerOpt> = {},
) => {
  const options = makeOptions(_options);
  const logger = makeLogger("btnc", options.debug);
  logger.info(
    "Starting Flic ButtonController with",
    JSON.stringify(options, null, 4),
  );
  logger.info("Setting listeners...");
  setListeners(ha, logger);
  logger.info("Registering all buttons...");
  const handleCreation = createHandleBtnCreation(ha, logger)("kickStart");
  buttonModule.getButtons().forEach(handleCreation);
  setInterval(() => {
    logger.debug("Updating button state!");
    buttonModule
      .getButtons()
      .forEach((btn) => publishButtonMetaByBdaddr(ha, btn.bdaddr, logger));
  }, 3000);
  logger.info("is up");
};
