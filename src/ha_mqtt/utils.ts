export const makeOptions = (opt: Partial<HAmqttOptions>): HAmqttOptions => ({
  debug: false,
  ...opt,
  topics: {
    homeassistant: "homeassistant",
    flic: "flic",
    ...opt.topics,
  },
});
