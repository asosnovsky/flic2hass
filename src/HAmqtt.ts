import { makeLogger } from "./Logger";
import { MQTT } from "./mqtt";

export type HAmqttOptions = {
    debug: boolean,
    topics: {
        homeassistant: string,
        flic: string,
    }
}
export type MQTTPublishOpt = {
    retain?: boolean // the server should retain this message and send it out again to new subscribers
    dup?: boolean   // indicate the message is a duplicate because original wasn't ACKed (QoS > 0 only)
}
export type HADevice = {
    name: string,
    identifiers: string[],
    manufacturer: string,
    model: string,
    sw?: string,
    hw?: string,
}
export type HAComponent = 'sensor' | 'binary_sensor' | 'button' | 'switch' | 'text';
export const makeOptions = (opt: Partial<HAmqttOptions>): HAmqttOptions => ({
    debug: false,
    ...opt,
    topics: {
        homeassistant: 'homeassistant',
        flic: 'flic',
        ...opt.topics,
    }
})
export type HAmqtt = ReturnType<typeof makeHAmqtt>;
export function makeHAmqtt(
    mqttServer: MQTT,
    options: Partial<HAmqttOptions> = {},
) {
    options = makeOptions(options);
    const logger = makeLogger('mqtt:ha', options.debug);
    logger.info("starting...", JSON.stringify(options, null, 4));

    const genFlicPrefix = (nodeId: string, objectId: string): string => {
        return `${options.topics.flic}/${nodeId}/${objectId}`
    }

    const genHAPrefix = (component: HAComponent, nodeId: string, objectId: string) => {
        return `${options.topics.homeassistant}/${component}/${nodeId}/${objectId}`
    }

    const publishState = (nodeId: string, objectId: string, state: any, opt: MQTTPublishOpt = {}) => {
        const btntopic = genFlicPrefix(nodeId, objectId);
        mqttServer.publish(btntopic, state + "", opt);
        logger.debug(btntopic, state, JSON.stringify(opt))
    }
    const registerEntity = (
        name: string,
        component: HAComponent,
        nodeId: string,
        objectId: string,
        device: HADevice,
        additionalProps: Record<string, any> = {},
    ) => {
        const configtopic = genHAPrefix(component, nodeId, objectId) + "/config"
        const configObj = {
            name,
            ...additionalProps,
            state_topic: genFlicPrefix(nodeId, objectId),
            unique_id: `Flic_${nodeId}_${objectId}`,
            device,
        };
        mqttServer.publish(configtopic, JSON.stringify(configObj), {
            retain: true,
        });
        logger.debug(configtopic, JSON.stringify(configObj, null, 4));
    }

    const deregisterEntity = (
        component: HAComponent,
        nodeId: string,
        objectId: string,
    ) => {
        const configtopic = genHAPrefix(component, nodeId, objectId) + "/config"
        mqttServer.publish(configtopic, null, { retain: false });
        logger.debug(configtopic, null);
    }

    return {
        deregisterEntity,
        registerEntity,
        publishState,
        genFlicPrefix,
    }
}