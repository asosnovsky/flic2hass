import { makeHAmqtt } from "./ha_mqtt/index";
import { startIRController } from "./ir_controller/index";

import { makeLogger } from "./Logger";
import { FlicMQTT } from "./mqtt_client/index";
import { startFlicHubController } from "./hub_controller/index";
import { startButtinStateHandler } from "./button_controller/index";

export const start = (options: Options) => {
  const mqttServer = new FlicMQTT(options.mqtt.host, {
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
      startButtinStateHandler(ha, options.flicBtns);
    }
    if (!options.flicIR?.disabled) {
      startIRController(ha, mqttServer, options.flicIR);
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
  mqttServer.on("disconnected", function () {
    logger.info("Lost access - disconnected");
    setTimeout(function () {
      throw new Error("disconnected");
    }, 1000);
  });
  mqttServer.on("close", function () {
    logger.info("Lost access - close");
    setTimeout(function () {
      throw new Error("closed");
    }, 1000);
  });
  mqttServer.connect();
};
