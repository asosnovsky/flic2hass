type HADevice = {
  name: string;
  identifiers: string[];
  manufacturer: string;
  model: string;
  sw_version?: string;
  hw_version?: string;
  serial_number?: string;
  configuration_url?: string;
};
type HAComponent =
  | "cover"
  | "select"
  | "media_player"
  | "light"
  | "sensor"
  | "binary_sensor"
  | "button"
  | "switch"
  | "text"
  | "device_automation";
type FlicMqttPrefix = {
  nodeId: string;
  objectId: string;
  mqttPrefix: string;
};
