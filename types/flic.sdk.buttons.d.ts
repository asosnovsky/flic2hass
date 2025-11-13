/**
 * Flic Hub Studio - Buttons Module
 * TypeScript Declaration File
 */

declare module "buttons" {
  import { EventEmitter } from "events";

  /** Button Object Type */
  export interface Button {
    bdaddr: string;
    serialNumber: string;
    color: string;
    name: string;
    activeDisconnect: boolean;
    connected: boolean;
    ready: boolean;
    batteryStatus: number | null;
    firmwareVersion: number | null;
    flicVersion: 1 | 2;
    uuid: string;
    key?: string; // Only for Flic 2
  }

  /** ScanWizard Event Types */
  type ScanWizardEventMap = {
    foundPrivateButton: [];
    foundPublicButton: [{ bdaddr: string }];
    buttonConnect: [{ bdaddr: string }];
    complete: [{ bdaddr: string }];
    fail: [{ error: ScanWizardFailReason }];
  };

  export type ScanWizardFailReason =
    | "CancelledByUser"
    | "FailedTimeout"
    | "ButtonIsPrivate"
    | "BluetoothUnavailable"
    | "InternetBackendError"
    | "InvalidData";

  /** ScanWizard Class */
  export interface ScanWizard extends EventEmitter {
    on<K extends keyof ScanWizardEventMap>(
      event: K,
      listener: (...args: ScanWizardEventMap[K]) => void,
    ): this;
    once<K extends keyof ScanWizardEventMap>(
      event: K,
      listener: (...args: ScanWizardEventMap[K]) => void,
    ): this;
    emit<K extends keyof ScanWizardEventMap>(
      event: K,
      ...args: ScanWizardEventMap[K]
    ): boolean;

    cancel(): void;
  }

  /** Buttons Event Types */
  export type ButtonsEventMap = {
    buttonAdded: [{ button: Button }];
    buttonUpdated: [{ button: Button }];
    buttonDeleted: [{ bdaddr: string }];
    buttonConnected: [{ bdaddr: string }];
    buttonReady: [{ bdaddr: string }];
    buttonDisconnected: [{ bdaddr: string }];
    buttonDown: [{ bdaddr: string }];
    buttonUp: [{ bdaddr: string }];
    buttonClickOrHold: [{ bdaddr: string; isClick: boolean; isHold: boolean }];
    buttonSingleOrDoubleClick: [
      { bdaddr: string; isSingleClick: boolean; isDoubleClick: boolean },
    ];
    buttonSingleOrDoubleClickOrHold: [
      {
        bdaddr: string;
        isSingleClick: boolean;
        isDoubleClick: boolean;
        isHold: boolean;
      },
    ];
  };

  /** Buttons Class */
  export interface Buttons extends EventEmitter {
    on<K extends keyof ButtonsEventMap>(
      event: K,
      listener: (...args: ButtonsEventMap[K]) => void,
    ): this;
    once<K extends keyof ButtonsEventMap>(
      event: K,
      listener: (...args: ButtonsEventMap[K]) => void,
    ): this;
    emit<K extends keyof ButtonsEventMap>(
      event: K,
      ...args: ButtonsEventMap[K]
    ): boolean;

    getButtons(): Button[];
    getButton(bdaddr: string): Button | null;
    startScanWizard(): ScanWizard;

    importFlic2Pairings(
      pairings: Array<{
        bdaddr: string;
        serialNumber: string;
        color: string;
        firmwareVersion: number;
        uuid: string;
        key: string;
      }>,
      callback: () => void,
    ): void;
  }

  const buttons: Buttons;
  export default buttons;
}
