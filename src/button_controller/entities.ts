export const ENTITIES: Record<string, [HAComponent, Record<string, any>]> = {
  name: [
    "sensor",
    {
      entity_category: "diagnostic",
      name: "Button Name",
    },
  ],
  action: ["sensor", { icon: "mdi:gesture-tap-button", name: "Click Action" }],
  state: ["sensor", { icon: "mdi:radiobox-indeterminate-variant" }],
  battery: [
    "sensor",
    { expire_after: 5, unit_of_measurement: "%", device_class: "battery" },
  ],
  connected: [
    "binary_sensor",
    {
      entity_category: "diagnostic",
      expire_after: 5,
      device_class: "connectivity",
      name: "Connection Established",
      payload_not_available: "OFF",
    },
  ],
  ready: [
    "binary_sensor",
    {
      entity_category: "config",
      expire_after: 5,
      device_class: "connectivity",
      name: "Connection Verified",
    },
  ],
  activeDisconnect: [
    "binary_sensor",
    {
      entity_category: "config",
      expire_after: 5,
      name: "User Active Disconnect",
    },
  ],
  passive: [
    "binary_sensor",
    { entity_category: "config", expire_after: 5, name: "Passive Mode" },
  ],
  button_short_press: [
    "device_automation",
    {
      type: "button_short_press",
      subtype: "button_1",
      automation_type: "trigger",
      payload: "ON",
    },
  ],
  button_long_press: [
    "device_automation",
    {
      type: "button_long_press",
      subtype: "button_1",
      automation_type: "trigger",
      payload: "ON",
    },
  ],
  button_double_press: [
    "device_automation",
    {
      type: "button_double_press",
      subtype: "button_1",
      automation_type: "trigger",
      payload: "ON",
    },
  ],
};
