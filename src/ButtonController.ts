import { HAComponent, HADevice, HAmqtt } from "./HAmqtt";
import { makeLogger } from "./Logger";
import { Button, ButtonModule } from "./flicTypes";

const ms2ISO8601 = (ms: number): string =>
    (new Date(ms)).toISOString().slice(0, 19).replace('T', ' ')

export type ButtonControllerOpt = {
    debug: boolean;
}
export const makeOptions = (opt: Partial<ButtonControllerOpt>): ButtonControllerOpt => ({
    debug: false,
    ...opt,
})
const ENTITIES: Record<string, [HAComponent, Record<string, any>]> = {
    "action": ['sensor', { icon: 'mdi:gesture-tap-button', name: "Click Action" }],
    "state": ['sensor', { icon: 'mdi:radiobox-indeterminate-variant' }],
    "battery": ['sensor', { expire_after: 5, unit_of_measurement: '%', device_class: 'battery' }],
    "batteryLastUpdate": ['sensor', { entity_category: "diagnostic", expire_after: 5, name: "Battery Last Update Time", device_class: "duration", unit_of_measurement: "s" }],
    "lifeline": ['binary_sensor', { entity_category: "diagnostic", expire_after: 5, name: "Flichub Connected", device_class: "connectivity", unit_of_measurement: "s" }],
    "connected": ['binary_sensor', { entity_category: "diagnostic", expire_after: 5, device_class: 'connectivity', name: "Connection Established" }],
    "ready": ['binary_sensor', { entity_category: "config", expire_after: 5, device_class: 'connectivity', name: "Connection Verified" }],
    "activeDisconnect": ['binary_sensor', { entity_category: "config", expire_after: 5, name: "User Active Disconnect" }],
    "passive": ['binary_sensor', { entity_category: "config", expire_after: 5, name: "Passive Mode" }],
}
export type ButtonController = ReturnType<typeof makeButtonController>;
export function makeButtonController(
    ha: HAmqtt,
    buttonModule: ButtonModule,
    options: Partial<ButtonControllerOpt> = {},
) {
    options = makeOptions(options);
    const logger = makeLogger('btnc', options.debug)
    logger.info("Starting Flic ButtonController with", JSON.stringify(options, null, 4));

    const getDeviceFromButton = (button: Button): HADevice => {
        return {
            name: button.name,
            identifiers: [button.serialNumber, button.uuid],
            manufacturer: 'Flic',
            model: `v${button.flicVersion}_${button.color.trim().length > 0 ? button.color : 'white'}`,
            sw: String(button.firmwareVersion),
            hw: String(button.flicVersion),
        }
    }
    const genButtonUniqueId = (bdaddr: string): string => bdaddr.replace(/:/g, '_')
    const registerButton = (button: Button) => {
        logger.info('Registering', JSON.stringify(button, null, 4))
        const haDevice = getDeviceFromButton(button);
        Object.keys(ENTITIES).forEach(objectId => {
            let avl = {
                availability: [
                    {
                        payload_available: 'ON',
                        payload_not_available: 'OFF',
                        topic: ha.genFlicPrefix(genButtonUniqueId(button.bdaddr), 'ready')
                    },
                    {
                        payload_available: 'ON',
                        payload_not_available: 'OFF',
                        topic: ha.genFlicPrefix(genButtonUniqueId(button.bdaddr), 'lifeline')
                    },
                ],
                availability_mode: 'all',
            };
            if (objectId === 'lifeline') {
                avl = {}
            }
            if (objectId === 'ready' || objectId == 'connected') {
                avl.availability = [avl.availability[1]]
            }
            ha.registerEntity(
                `Button ${objectId}`,
                ENTITIES[objectId][0],
                genButtonUniqueId(button.bdaddr),
                objectId,
                haDevice,
                {
                    ...ENTITIES[objectId][1],
                    ...avl
                },
            )
        });
    }
    const deregisterButton = (button: Button) => {
        logger.info('Deregistering', JSON.stringify(button, null, 4))
        Object.keys(ENTITIES).forEach(objectId => {
            ha.deregisterEntity(
                ENTITIES[objectId][0],
                genButtonUniqueId(button.bdaddr),
                objectId,
            )
        });
    }
    const publishButtonState = (button: Button, state: 'released' | 'pressed') => {
        ha.publishState(genButtonUniqueId(button.bdaddr), 'state', state);
    }
    const publishButtonAction = (button: Button, state: string) => {
        ha.publishState(genButtonUniqueId(button.bdaddr), 'action', state);
    }
    const publishButtonMeta = (button: Button) => {
        ha.publishState(genButtonUniqueId(button.bdaddr), 'battery', button.batteryStatus);
        ha.publishState(genButtonUniqueId(button.bdaddr), 'batteryLastUpdate', button.batteryTimestamp ? `${Math.round((Date.now() - button.batteryTimestamp) / 1000)}` : 'unknown');
        ha.publishState(genButtonUniqueId(button.bdaddr), 'connected', button.connected ? 'ON' : "OFF");
        ha.publishState(genButtonUniqueId(button.bdaddr), 'ready', button.ready ? 'ON' : "OFF");
        ha.publishState(genButtonUniqueId(button.bdaddr), 'activeDisconnect', button.activeDisconnect ? 'ON' : "OFF");
        ha.publishState(genButtonUniqueId(button.bdaddr), 'passive', button.activeDisconnect ? 'ON' : "OFF");
        ha.publishState(genButtonUniqueId(button.bdaddr), 'lifeline', 'ON');
    }
    const addBtn = (eventName: string) => (obj: { bdaddr: string }) => {
        const button = buttonModule.getButton(obj.bdaddr);
        logger.info(eventName, "upserting", button.name, genButtonUniqueId(button.bdaddr));
        registerButton(button);
    }
    const start = () => {
        logger.info("Starting...")
        let resetActiontInv: null | any = null;
        buttonModule.on('buttonAdded', addBtn('buttonAdded'));
        buttonModule.on('buttonConnected', addBtn('buttonConnected'));
        buttonModule.on('buttonReady', (btn) => {
            addBtn('buttonReady')(btn);
            const button = buttonModule.getButton(btn.bdaddr);
            publishButtonState(button, 'released')
            publishButtonAction(button, 'none')
        });
        buttonModule.on('buttonUpdated', addBtn('buttonUpdated'));
        buttonModule.on('buttonDeleted', (btn) => {
            logger.debug('buttonDeleted', JSON.stringify(btn, null, 4))
            deregisterButton(btn);
            publishButtonMeta(btn);
        });
        buttonModule.on('buttonDisconnected', ({ bdaddr }) => {
            publishButtonMeta(buttonModule.getButton(bdaddr));
        });
        buttonModule.on('buttonDown', ({ bdaddr }) => {
            const btn = buttonModule.getButton(bdaddr);
            publishButtonState(btn, 'pressed');
            publishButtonMeta(btn);
        });
        buttonModule.on('buttonUp', ({ bdaddr }) => {
            const btn = buttonModule.getButton(bdaddr);
            publishButtonState(btn, 'released');
            publishButtonMeta(btn);
        });
        buttonModule.on('buttonSingleOrDoubleClickOrHold', obj => {
            if (resetActiontInv !== null) {
                clearTimeout(resetActiontInv);
            }
            const btn = buttonModule.getButton(obj.bdaddr);
            publishButtonAction(
                btn,
                obj.isSingleClick ? "click" : obj.isDoubleClick ? "double_click" : "hold",
            );
            publishButtonMeta(btn);
            resetActiontInv = setTimeout(() => {
                publishButtonAction(btn, 'none');
            }, 500)
        });
        logger.info("Registering all buttons...")
        buttonModule.getButtons().forEach(registerButton);
        setInterval(() => buttonModule.getButtons().forEach(publishButtonMeta), 3000);
        logger.info('is up')
    }

    return {
        start,
        publishButtonAction,
        publishButtonMeta,
        publishButtonState,
    }
}