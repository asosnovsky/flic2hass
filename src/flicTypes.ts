

export type Button = {
    bdaddr: string // Device address of button
    serialNumber: string // Serial number
    color: string // Colour of the button (lowercase)
    name: string // The user assigned button name
    activeDisconnect: boolean // The user has explicitly disconnected the button
    connected: boolean // The connection to the button is currently established
    ready: boolean // The connection is verified (see buttonReady)
    batteryStatus: number | null // Battery level in percent (0-100), or null if unknown
    batteryTimestamp: number | null // Last time the battery was updated
    firmwareVersion: number | null // Firmware version of button, or null if unknown
    flicVersion: number | null // Flic version (1 or 2)
    uuid: string // A 32 characters long hex string, unique for every button
    key: number | null // A 40 characters long hex string (only for Flic 2)
}

export interface ButtonModule {
    getButtons(): Button[],
    getButton(bdaddr: string): Button,
    on(ev: "buttonAdded", cb: (btn: Button) => void): void,
    on(ev: "buttonUpdated", cb: (btn: Button) => void): void,
    on(ev: "buttonDeleted", cb: (btn: Button) => void): void,
    on(ev: "buttonConnected", cb: (btn: Button) => void): void,
    on(ev: "buttonReady", cb: (obj: { bdaddr: string }) => void): void,
    on(ev: "buttonDisconnected", cb: (obj: { bdaddr: string }) => void): void,
    on(ev: "buttonDown", cb: (obj: { bdaddr: string }) => void): void,
    on(ev: "buttonUp", cb: (obj: { bdaddr: string }) => void): void,
    on(ev: "buttonClickOrHold", cb: (obj: { bdaddr: string, isClick: boolean, isHold: boolean }) => void): void,
    on(ev: "buttonSingleOrDoubleClick", cb: (obj: { bdaddr: string, isSingleClick: boolean, isDoubleClick: boolean }) => void): void,
    on(ev: "buttonSingleOrDoubleClickOrHold", cb: (obj: { bdaddr: string, isSingleClick: boolean, isDoubleClick: boolean, isHold: boolean }) => void): void,
}

export interface IRModule {
    record(): void;
    cancelRecord(): void;
    play(arr: Uint32Array, cb: (err: any | undefined) => void): void;
    on(ev: 'recordComplete', cb: (d: Uint32Array) => void): void;
}