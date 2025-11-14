// net.d.ts
// TypeScript declarations for Flic Hub Studio 'net' (TCP) module
// Based on: https://studio.flic.io/static/documentation/#63_tcp_module

declare module "net" {
  import { EventEmitter } from "events";
  /**
   * Creates a TCP server.
   */
  function createServer(
    options?: ServerOptions,
    connectionListener?: (socket: Socket) => void,
  ): Server;

  /**
   * Creates a TCP socket and connects it to the specified port and host.
   */
  function createConnection(
    options: ConnectOptions,
    connectionListener?: () => void,
  ): Socket;

  /**
   * Alternative signature for createConnection.
   */
  function createConnection(
    port: number,
    host?: string,
    connectionListener?: () => void,
  ): Socket;

  /**
   * TCP Server class.
   */
  class Server extends EventEmitter {
    constructor(
      options?: ServerOptions,
      connectionListener?: (socket: Socket) => void,
    );

    /**
     * Start listening for connections.
     */
    listen(options: ListenOptions, callback?: () => void): this;
    listen(
      port?: number,
      host?: string,
      backlog?: number,
      callback?: () => void,
    ): this;
    listen(port?: number, host?: string, callback?: () => void): this;
    listen(port?: number, callback?: () => void): this;

    /**
     * Stop the server from accepting new connections.
     */
    close(callback?: (err?: Error) => void): this;

    /**
     * Returns the bound address, family, and port of the server.
     */
    address(): AddressInfo | null;

    /**
     * Asynchronously get the number of concurrent connections.
     */
    getConnections(callback: (err: Error | null, count: number) => void): void;

    /**
     * Whether the server is currently listening.
     */
    readonly listening: boolean;

    // Events
    on(event: "close", listener: () => void): this;
    on(event: "connection", listener: (socket: Socket) => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(event: "listening", listener: () => void): this;
  }

  /**
   * TCP Socket class.
   */
  export class Socket extends EventEmitter {
    constructor(options?: SocketOptions);

    /**
     * Initiate a connection.
     */
    connect(options: ConnectOptions, connectionListener?: () => void): this;
    connect(port: number, host?: string, connectionListener?: () => void): this;

    /**
     * Send data on the socket.
     */
    write(
      data: string | Buffer | Uint8Array,
      encoding?: string,
      callback?: (err?: Error) => void,
    ): boolean;
    write(
      data: string | Buffer | Uint8Array,
      callback?: (err?: Error) => void,
    ): boolean;

    /**
     * Half-close the socket (send FIN).
     */
    end(
      data?: string | Buffer | Uint8Array,
      encoding?: string,
      callback?: () => void,
    ): this;
    end(data?: string | Buffer | Uint8Array, callback?: () => void): this;
    end(callback?: () => void): this;

    /**
     * Abruptly close the socket.
     */
    destroy(exception?: Error): this;

    /**
     * Pause reading data.
     */
    pause(): this;

    /**
     * Resume reading after pause().
     */
    resume(): this;

    /**
     * Set encoding for incoming data.
     */
    setEncoding(encoding?: "utf8" | "hex" | "base64" | null): this;

    /**
     * Disable Nagle's algorithm (enable no delay).
     */
    setNoDelay(noDelay?: boolean): this;

    /**
     * Enable/disable TCP keep-alive.
     */
    setKeepAlive(enable?: boolean, initialDelay?: number): this;

    /**
     * Get local address info.
     */
    address(): AddressInfo | null;

    // Read-only properties
    readonly connecting: boolean;
    readonly destroyed: boolean;
    readonly localAddress?: string;
    readonly localPort?: number;
    readonly remoteAddress?: string;
    readonly remotePort?: number;
    readonly remoteFamily?: string;
    readonly bytesRead: number;
    readonly bytesWritten: number;

    // Events
    on(event: "close", listener: (hadError: boolean) => void): this;
    on(event: "connect", listener: () => void): this;
    on(event: "data", listener: (data: Buffer | string) => void): this;
    on(event: "drain", listener: () => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
    on(
      event: "lookup",
      listener: (
        err: Error | null,
        address: string | null,
        family: string,
        host: string,
      ) => void,
    ): this;
    on(event: "ready", listener: () => void): this;
  }

  // Option Interfaces

  interface ServerOptions {
    /**
     * Allow half-open TCP connections.
     * Default: false
     */
    allowHalfOpen?: boolean;

    /**
     * Pause incoming connections until resume() is called.
     * Default: false
     */
    pauseOnConnect?: boolean;
  }

  interface SocketOptions {
    /**
     * Allow half-open TCP connections.
     * Default: false
     */
    allowHalfOpen?: boolean;
  }

  interface ConnectOptions {
    port: number;
    host?: string;
  }

  interface ListenOptions {
    port?: number;
    host?: string;
    backlog?: number;
  }

  interface AddressInfo {
    address: string;
    family: "IPv4";
    port: number;
  }

  // Module export
  const net: {
    createServer: typeof createServer;
    createConnection: typeof createConnection;
    Server: typeof Server;
    Socket: typeof Socket;
  };
  export default net;
}
