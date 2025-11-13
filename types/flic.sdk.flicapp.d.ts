declare module "flicapp" {
  import { EventEmitter } from "events";
  /**
   * The FlicApp class allows integration with virtual devices and message actions
   * configured in the Flic mobile app for use with Flic Twist and other controls.
   */
  export class FlicApp extends EventEmitter {
    /**
     * Emitted when a message action configured in the Flic app is triggered.
     * Useful for advanced Flic Twist configurations like action points in dimming or Scene Blender.
     *
     * @event actionMessage
     * @param message - The configured message string from the Flic app
     */
    on(event: "actionMessage", listener: (message: string) => void): this;

    /**
     * Emitted when a Flic Twist rotation updates a virtual device.
     * Only includes the fields that changed in this update.
     *
     * @event virtualDeviceUpdate
     * @param update - Object containing metadata and updated values
     */
    on(
      event: "virtualDeviceUpdate",
      listener: (update: VirtualDeviceUpdate) => void,
    ): this;

    /**
     * Updates the state of a virtual device in the Flic app to reflect external changes.
     * This keeps the Flic Twist in sync (e.g., LED indicators, small movements).
     *
     * Note: For Advanced Dimming and Scene Blender, this is not required as communication is one-way.
     *
     * @param type - Type of the virtual device
     * @param id - Identifier of the virtual device (must match Flic app configuration)
     * @param values - Partial state update with values between 0 and 1
     */
    virtualDeviceUpdateState(
      type: VirtualDeviceType,
      id: string,
      values: VirtualDeviceValues,
    ): void;
  }

  /** Supported virtual device types */
  export type VirtualDeviceType = "Light" | "Blind" | "Speaker";

  /** Metadata included in virtualDeviceUpdate events */
  export interface VirtualDeviceMetaData {
    /** ID of the Flic Button or Twist that triggered the change */
    buttonId: string;
    /** Type of dimmable device */
    dimmableType: VirtualDeviceType;
    /** ID of the virtual device being controlled */
    virtualDeviceId: string;
  }

  /** Possible value fields in virtual device updates */
  export interface VirtualDeviceValues {
    /** Brightness level (0 to 1) - for Light, Blind, Speaker */
    brightness?: number;
    /** Hue (0 to 1) - for Light */
    hue?: number;
    /** Saturation (0 to 1) - for Light */
    saturation?: number;
    /** Color temperature (0 to 1) - for Light */
    colorTemperature?: number;
    /** Volume level (0 to 1) - for Speaker */
    volume?: number;
    /** Position (0 to 1) - for Blind */
    position?: number;
  }

  /** Full structure of a virtualDeviceUpdate event */
  export interface VirtualDeviceUpdate {
    metaData: VirtualDeviceMetaData;
    values: VirtualDeviceValues;
  }

  /** The exported module instance */
  const flicapp: FlicApp;
  export default flicapp;
}
