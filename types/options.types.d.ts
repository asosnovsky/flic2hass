type HAmqttOptions = {
  debug: boolean;
  topics: {
    homeassistant: string;
    flic: string;
  };
};
type MQTTPublishOpt = {
  retain?: boolean; // the server should retain this message and send it out again to new subscribers
  dup?: boolean; // indicate the message is a duplicate because original wasn't ACKed (QoS > 0 only)
};
type ButtonControllerOpt = {
  debug: boolean;
};
type IRControllerOpt = {
  uniqueId: string;
  debug: boolean;
};
type FlicHubOptions = {
  uniqueId: string;
  debug: boolean;
};
type MQTTOptions = {
  port: number;
  client_id: string | number[];
  keep_alive: number | boolean;
  clean_session: boolean;
  username?: string;
  password?: string;
  protocol_name: string;
  protocol_level: number;
};
type Flic2HassMQTTOptions = MQTTOptions & {
  host: string;
};
type Options = {
  mqtt: Partial<Flic2HassMQTTOptions> & { host: string };
  debug?: boolean;
  ha?: Partial<HAmqttOptions>;
  flicBtns?: Partial<ButtonControllerOpt> & { disabled?: boolean };
  flicIR?: Partial<IRControllerOpt> & { disabled?: boolean };
  flicHub?: Partial<FlicHubOptions> & { disabled?: boolean };
};
