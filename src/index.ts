import { makeButtonController } from "./button_controller/index";

import { makeHAmqtt } from "./ha_mqtt/index";
import { makeIRController } from "./ir_controller/index";

import { makeLogger } from "./Logger";
import * as mqtt from "./mqtt";
import { startFlicHubController } from "./hub_controller/index";

export const start = (options: Options) => {
  const mqttServer = mqtt.create(options.mqtt.host, {
    ...options.mqtt,
    keep_alive: true,
  });
  const logger = makeLogger("root", options.debug ?? false);
  options.ha = options.ha ?? {};
  options.flicBtns = options.flicBtns ?? {};
  options.flicIR = options.flicIR ?? {};
  options.flicHub = options.flicHub ?? {};
  options.ha.debug = options.ha.debug ?? options.debug ?? false;
  options.flicBtns.debug = options.flicBtns.debug ?? options.debug ?? false;
  options.flicIR.debug = options.flicIR.debug ?? options.debug ?? false;
  options.flicHub.debug = options.flicHub.debug ?? options.debug ?? false;
  const ha = makeHAmqtt(mqttServer, options.ha);
  mqttServer.on("connected", () => {
    logger.info("connected to mqtt");
    if (!options.flicBtns?.disabled) {
      makeButtonController(ha, options.flicBtns).start();
    }
    if (!options.flicIR?.disabled) {
      makeIRController(ha, mqttServer, options.flicIR).start();
    }
    if (!options.flicHub?.disabled) {
      startFlicHubController(ha, mqttServer, options.flicHub);
    }
    logger.info("all services up!");
  });
  mqttServer.on("error", function (err) {
    logger.info("'Error' event", JSON.stringify(err));
    setTimeout(function () {
      throw new Error("Crashed");
    }, 1000);
  });
  mqttServer.on("disconnected", function (err) {
    logger.info("'Error' disconnected", JSON.stringify(err));
    setTimeout(function () {
      throw new Error("Crashed");
    }, 1000);
  });
  mqttServer.on("close", function (err) {
    logger.info("'Error' close", JSON.stringify(err));
    setTimeout(function () {
      throw new Error("Crashed");
    }, 1000);
  });
  mqttServer.connect();
};
