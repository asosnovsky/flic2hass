declare module "hubinfo" {
  export interface HubInfo {
    serialNumber: string;
    firmwareVersion: string;
  }
  const hubinfo: HubInfo;
  export default hubinfo;
}
