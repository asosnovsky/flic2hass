/**
 * Flic Hub Studio - IR Module
 * TypeScript Declaration File
 */

declare module "ir" {
  import { EventEmitter } from "events";

  /** IR Class */
  export interface IR extends EventEmitter {
    on(event: "recordComplete", listener: (arr: Uint32Array) => void): this;
    once(event: "recordComplete", listener: (arr: Uint32Array) => void): this;
    emit(event: "recordComplete", arr: Uint32Array): boolean;

    record(): void;
    cancelRecord(): void;
    play(arr: Uint32Array, callback: (error: any) => void): void;
  }

  const ir: IR;
  export default ir;
}
