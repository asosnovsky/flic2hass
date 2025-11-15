// datastore.d.ts
/**
 * Flic Hub Studio - Datastore Module Type Declarations
 * Based on: https://studio.flic.io/static/documentation/#133_datastore_module
 */

declare module "datastore" {
  /**
   * The Datastore class provides persistent key-value storage per package.
   * Keys and values are strings. Storage is isolated per package.
   */
  class Datastore {
    /**
     * Stores a string value under the given key.
     *
     * @param key - The key under which to store the value.
     * @param value - The string value to store.
     * @param callback - Optional callback invoked when the operation completes.
     *                   Receives an error if the operation failed, otherwise null.
     */
    put(
      key: string,
      value: string,
      callback?: (error: Error | null) => void,
    ): void;

    /**
     * Retrieves a stored string value by key.
     *
     * @param key - The key to look up.
     * @param callback - Required callback invoked when the operation completes.
     *                   - error: null if successful, or Error if a datastore error occurred (other than not found).
     *                   - result: The stored string, or null if the key was not found.
     */
    get(
      key: string,
      callback: (error: Error | null, result: string | null) => void,
    ): void;
  }

  /**
   * The default export is an instance of the Datastore class.
   */
  const datastore: Datastore;
  export default datastore;
}
