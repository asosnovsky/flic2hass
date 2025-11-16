import { Button } from "buttons";
import { HAmqtt } from "../ha_mqtt/index";
import { Logger } from "../Logger";

export const makeOptions = (
  opt: Partial<ButtonControllerOpt>,
): ButtonControllerOpt => ({
  debug: false,
  ...opt,
});

export const genButtonUniqueId = (bdaddr: string): string =>
  bdaddr.replace(/:/g, "_");

export type ButtonMqttEntity = FlicMqttPrefix & {
  component: HAComponent;
  additionalProps: Record<string, any>;
};
export type ButtonConstants = ReturnType<typeof getConstants>;
export type ButtonConstantsNames = keyof ButtonConstants;
export const getConstants = (ha: HAmqtt, bdaddr: string) => {
  const uniqId = genButtonUniqueId(bdaddr);
  const lifeline = ha.genFlicPrefixObject(uniqId, "lifeline");
  const ready = ha.genFlicPrefixObject(uniqId, "ready");
  const connected = ha.genFlicPrefixObject(uniqId, "connected");
  const key_availability = [
    {
      payload_available: "ON",
      payload_not_available: "unavailable",
      topic: lifeline.mqttPrefix,
    },
  ];
  const availability = {
    availability: [
      ...key_availability,
      {
        payload_available: "ON",
        payload_not_available: "unavailable",
        topic: ready.mqttPrefix,
      },
      {
        payload_available: "ON",
        payload_not_available: "unavailable",
        topic: connected.mqttPrefix,
      },
    ],
    availability_mode: "all",
  };
  return {
    uniqId,
    LIFELINE_SIGNAL: {
      ...lifeline,
      component: "binary_sensor",
      additionalProps: {
        entity_category: "diagnostic",
        expire_after: 5,
        device_class: "connectivity",
        name: "Button Controller Connected",
        payload_not_available: "OFF",
      },
    } as ButtonMqttEntity,

    signals: {
      READY: {
        ...ready,
        component: "binary_sensor",
        additionalProps: {
          entity_category: "diagnostic",
          expire_after: 5,
          device_class: "connectivity",
          name: "Button Ready",
          payload_not_available: "OFF",
          availability: key_availability,
        },
      } as ButtonMqttEntity,
      CONNECTED: {
        ...connected,
        component: "binary_sensor",
        additionalProps: {
          entity_category: "diagnostic",
          expire_after: 5,
          device_class: "connectivity",
          name: "Button Connected",
          payload_not_available: "OFF",
          availability: key_availability,
        },
      } as ButtonMqttEntity,
    },

    states: {
      ACTION: {
        ...ha.genFlicPrefixObject(uniqId, "action"),
        component: "sensor",
        additionalProps: {
          icon: "mdi:gesture-tap-button",
          name: "Click Action",
          availability,
        },
      } as ButtonMqttEntity,
      STATE: {
        ...ha.genFlicPrefixObject(uniqId, "state"),
        component: "sensor",
        additionalProps: {
          icon: "mdi:radiobox-indeterminate-variant",
          availability,
        },
      } as ButtonMqttEntity,
      BATTERY: {
        ...ha.genFlicPrefixObject(uniqId, "battery"),
        component: "sensor",
        additionalProps: {
          expire_after: 5,
          unit_of_measurement: "%",
          device_class: "battery",
          availability,
        },
      } as ButtonMqttEntity,
      ACTIVE_DISCONNECT: {
        ...ha.genFlicPrefixObject(uniqId, "activeDisconnect"),
        component: "binary_sensor",
        additionalProps: {
          entity_category: "config",
          expire_after: 5,
          name: "Explicitly disconnected button by user",
          availability,
        },
      } as ButtonMqttEntity,
    },

    actions: {
      SHORT_PRESS: {
        ...ha.genFlicPrefixObject(uniqId, "button_short_press"),
        component: "device_automation",
        additionalProps: {
          type: "button_short_press",
          subtype: "button_1",
          automation_type: "trigger",
          payload: "button_short_press",
        },
      } as ButtonMqttEntity,
      LONG_PRESS: {
        ...ha.genFlicPrefixObject(uniqId, "button_long_press"),
        component: "device_automation",
        additionalProps: {
          type: "button_long_press",
          subtype: "button_1",
          automation_type: "trigger",
          payload: "button_long_press",
        },
      } as ButtonMqttEntity,
      DOUBLE_PRESS: {
        ...ha.genFlicPrefixObject(uniqId, "button_double_press"),
        component: "device_automation",
        additionalProps: {
          type: "button_double_press",
          subtype: "button_1",
          automation_type: "trigger",
          payload: "button_double_press",
        },
      } as ButtonMqttEntity,
    },
  };
};

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
export const registerEntities = (
  ha: HAmqtt,
  button: Button,
  logger: Logger,
): ButtonConstants => {
  const constants = getConstants(ha, button.bdaddr);
  const haDevice = getDeviceFromButton(button);
  logger.info(
    "Registering",
    JSON.stringify(
      { bdaddr: button.bdaddr, uniqId: constants.uniqId },
      null,
      4,
    ),
  );
  ha.startLifeLine(
    "Button Controller Connected",
    constants.uniqId,
    haDevice,
    constants.LIFELINE_SIGNAL.objectId,
  );
  registerHAObjects(constants.actions, ha, constants.uniqId, haDevice, logger);
  registerHAObjects(constants.signals, ha, constants.uniqId, haDevice, logger);
  registerHAObjects(constants.states, ha, constants.uniqId, haDevice, logger);
  return constants;
};

const registerHAObjects = (
  objs: Record<string, ButtonMqttEntity>,
  ha: HAmqtt,
  uniqId: string,
  haDevice: HADevice,
  logger: Logger,
) => {
  Object.keys(objs).forEach((k) => {
    const o = objs[k];
    logger.info(
      "Registering",
      JSON.stringify({ entity: k, objcetId: o.objectId, uniqId }, null, 4),
    );
    ha.registerEntity(
      `Button ${o.objectId}`,
      o.component,
      uniqId,
      o.objectId,
      haDevice,
      o.additionalProps,
    );
  });
};

export const deregisterButton = (
  ha: HAmqtt,
  bdaddr: string,
  logger: Logger,
) => {
  const constants = getConstants(ha, bdaddr);
  const uniqId = constants.uniqId;
  logger.info("Deregistering", JSON.stringify({ bdaddr, uniqId }, null, 4));
  deregisterHAObjects(constants.actions, ha, uniqId, logger);
  deregisterHAObjects(constants.signals, ha, uniqId, logger);
  deregisterHAObjects(constants.states, ha, uniqId, logger);
};

const deregisterHAObjects = (
  objs: Record<string, ButtonMqttEntity>,
  ha: HAmqtt,
  uniqId: string,
  logger: Logger,
) => {
  Object.keys(objs).forEach((k) => {
    const o = objs[k];
    logger.info(
      "Deregistering",
      JSON.stringify({ entity: k, objcetId: o.objectId, uniqId }, null, 4),
    );
    ha.deregisterEntity(o.component, uniqId, o.objectId);
  });
};
