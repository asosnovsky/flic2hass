// globals.d.ts
// TypeScript declarations for Flic Hub Studio Global Functions & Classes
// https://studio.flic.io/static/documentation/#165_global_functions_and_classes

/**
 * Global Buffer class (Node.js-like, partial support)
 * Unsupported: poolSize, indexOf, lastIndexOf, swap16/32/64, BigInt methods
 * Supported encodings: 'utf8', 'hex', 'base64'
 */
declare class Buffer extends Uint8Array {
  /** Create Buffer from string, array, etc. */
  constructor(
    source: string | ArrayBuffer | ArrayBufferView | number | Array<number>,
    encoding?: "utf8" | "hex" | "base64",
  );

  /** Length of the buffer */
  readonly length: number;

  /** Convert to string */
  toString(
    encoding?: "utf8" | "hex" | "base64",
    start?: number,
    end?: number,
  ): string;

  /** Write string to buffer */
  write(
    string: string,
    offset?: number,
    length?: number,
    encoding?: "utf8" | "hex" | "base64",
  ): number;

  /** Copy between buffers */
  copy(
    target: Buffer,
    targetStart?: number,
    sourceStart?: number,
    sourceEnd?: number,
  ): number;

  /** Fill buffer with value */
  fill(
    value: string | number | Buffer,
    offset?: number,
    end?: number,
    encoding?: "utf8" | "hex" | "base64",
  ): this;

  /** Compare two buffers */
  equals(otherBuffer: Buffer): boolean;

  /** Slice buffer */
  slice(start?: number, end?: number): Buffer;

  /** Static: Allocate new buffer */
  static alloc(
    size: number,
    fill?: string | number | Buffer,
    encoding?: "utf8" | "hex" | "base64",
  ): Buffer;

  /** Static: Concatenate buffers */
  static concat(list: Buffer[], totalLength?: number): Buffer;

  /** Static: From string or array */
  static from(
    source: string | ArrayBuffer | ArrayBufferView | Array<number>,
    encoding?: "utf8" | "hex" | "base64",
  ): Buffer;

  /** Static: Check if value is Buffer */
  static isBuffer(obj: any): obj is Buffer;

  /** Static: Byte length of string */
  static byteLength(
    string: string,
    encoding?: "utf8" | "hex" | "base64",
  ): number;
}

/**
 * TextEncoder (Web API)
 * Only UTF-8 supported
 * encodeInto() is NOT supported
 */
declare class TextEncoder {
  readonly encoding: "utf-8";

  encode(input?: string): Uint8Array;
}

/**
 * TextDecoder (Web API)
 * Only UTF-8 supported
 */
declare class TextDecoder {
  constructor(
    label?: "utf-8",
    options?: { fatal?: boolean; ignoreBOM?: boolean },
  );

  readonly encoding: "utf-8";
  readonly fatal: boolean;
  readonly ignoreBOM: boolean;

  decode(input?: BufferSource, options?: { stream?: boolean }): string;
}

/**
 * Timer API (Node.js-like)
 */
declare function setTimeout(
  callback: (...args: any[]) => void,
  ms?: number,
  ...args: any[]
): number;
declare function setInterval(
  callback: (...args: any[]) => void,
  ms?: number,
  ...args: any[]
): number;
declare function clearTimeout(timeoutId: number): void;
declare function clearInterval(intervalId: number): void;

/**
 * Debug printing (console.log alias)
 */
declare function print(...args: any[]): void;
