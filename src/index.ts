import {ButtonControllerOpt, makeButtonController} from "./ButtonController";
import {HAmqttOptions, makeHAmqtt} from './HAmqtt';
import {IRControllerOpt, makeIRController} from "./IRController";
import {makeLogger} from "./Logger";
import {ButtonModule, IRModule} from './flicTypes';
import * as mqtt from './mqtt';

export type MQTTOpt = {
    host: string;
    port: number;
    client_id: string;
    keep_alive: boolean;
    clean_session: boolean;
    username: string;
    password: string;
}
export type Options = {
    mqtt: Partial<MQTTOpt> & { host: string };
    debug?: boolean;
    ha?: Partial<HAmqttOptions>;
    flicBtns?: Partial<ButtonControllerOpt> & { disabled?: boolean };
    flicIR?: Partial<IRControllerOpt> & { disabled?: boolean };
}
export const start = (
    buttonModule: ButtonModule,
    irModule: IRModule,
    options: Options,
) => {
    const mqttServer = mqtt.create(
        options.mqtt.host,
        {...options.mqtt, keep_alive: true},
    );
    const logger = makeLogger('root', options.debug ?? false);
    options.ha = options.ha ?? {};
    options.flicBtns = options.flicBtns ?? {};
    options.flicIR = options.flicIR ?? {};
    options.ha.debug = options.ha.debug ?? options.debug ?? false;
    options.flicBtns.debug = options.flicBtns.debug ?? options.debug ?? false;
    options.flicIR.debug = options.flicIR.debug ?? options.debug ?? false;
    const ha = makeHAmqtt(mqttServer, options.ha);
    mqttServer.on('connected', () => {
        logger.info("connected to mqtt");
        if (!options.flicBtns?.disabled) {
            makeButtonController(
                ha, buttonModule, options.flicBtns,
            ).start();
        }
        if (!options.flicIR?.disabled) {
            makeIRController(
                irModule,
                ha,
                mqttServer,
                options.flicIR,
            ).start();
        }
        logger.info("all services up!");
    });
    mqttServer.on('error', function (err) {
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