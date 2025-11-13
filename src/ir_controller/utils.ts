export const NODE_ID = "FlicHubIR";
export const convertUint32Array2Str = (arr: Uint32Array): string => {
  let outStr = [];
  for (let i = 0; i < arr.length; i++) {
    outStr.push(arr[i].toString(32));
  }
  return outStr.join("_");
};
export const convertStr2Uint32Array = (s: string): Uint32Array => {
  const a = s.split("_");
  return new Uint32Array(a.slice(0, a.length - 2).map((v) => parseInt(v, 32)));
};

export const makeOptions = (
  opt: Partial<IRControllerOpt>,
): IRControllerOpt => ({
  debug: false,
  uniqueId: "0",
  ...opt,
});
