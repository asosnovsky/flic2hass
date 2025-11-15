import datastore from "datastore";
import { Logger } from "../Logger";
import { generateRandomKeyNotInList } from "./utils";
export type IRRecordedSignal = string;
export type SavedIRRecordedSignal = {
  name: string;
  signal: IRRecordedSignal;
};
export type IRStoredCache = {
  currentSelection: string | null;
  signals: Record<string, IRRecordedSignal>;
};
export type IRSignalStoreCallback = {
  (err: Error, data: null): void;
  (err: null, data: IRStoredCache): void;
};
export class IRSignalStore {
  private internalCacheStore: IRStoredCache | null = null;
  constructor(
    private logger: Logger,
    private storeCacheKey = "flic2hass:ir:signals",
  ) {
    this.reloadLocalCache();
  }

  reloadLocalCache(cb: IRSignalStoreCallback = () => {}) {
    this.getValues((err, data) => {
      if (err) {
        return cb(err, null);
      }
      if (data) {
        this.internalCacheStore = data;
        return cb(null, data);
      }
    });
  }

  getValues(cb: IRSignalStoreCallback) {
    return datastore.get(this.storeCacheKey, (err, data) => {
      if (err) {
        return cb(err, null);
      }
      if (!data) {
        return cb(null, {
          currentSelection: null,
          signals: {},
        });
      }
      try {
        return cb(null, JSON.parse(data));
      } catch (err) {
        this.logger.error(
          `Failed to parse json defaulting to empty -> data=${data} err=${err}`,
        );
        return cb(null, {
          currentSelection: null,
          signals: {},
        });
      }
    });
  }

  withData(
    cb: (
      signals: IRStoredCache["signals"],
      currentSelection: IRStoredCache["currentSelection"],
    ) => void,
  ) {
    if (this.internalCacheStore) {
      cb(
        this.internalCacheStore["signals"],
        this.internalCacheStore["currentSelection"],
      );
    } else {
      this.reloadLocalCache((err, data) => {
        if (err) {
          throw err;
        }
        if (!data) {
          throw new Error("failed to get data");
        }
        return cb(data["signals"], data["currentSelection"]);
      });
    }
  }

  withDataIndexed(
    cb: (
      data: SavedIRRecordedSignal[],
      currentSelection: IRStoredCache["currentSelection"],
    ) => void,
  ) {
    this.withData((signals, currentSelection) => {
      cb(
        Object.keys(signals).map((k) => ({
          name: k,
          signal: signals[k],
        })),
        currentSelection,
      );
    });
  }

  setSelection(
    selection: string,
    cb: (s: IRStoredCache["currentSelection"]) => void,
  ) {
    this.withData((signals) => {
      if (signals[selection]) {
        this.persist({
          signals,
          currentSelection: selection,
        });
        return cb(selection);
      }
      this.logger.error(
        `Not setting currentSelection to ${selection} as data.keys=${Object.keys(signals)}, consider reloading or deleting the entity in home-assistant.`,
      );
      this.persist({
        signals,
        currentSelection: null,
      });
      return cb(null);
    });
  }

  add(signal: string, cb: (name: string) => void) {
    this.withData((signals, currentSelection) => {
      const randomName = generateRandomKeyNotInList(Object.keys(signals));
      signals[randomName] = signal;
      this.persist({ signals, currentSelection });
      cb(randomName);
    });
  }

  remove(name: string, cb: () => void) {
    this.withData((signals, currentSelection) => {
      delete signals[name];
      this.persist({ signals, currentSelection });
      return cb();
    });
  }

  removeCurrent(cb: () => void) {
    this.withData((signals, currentSelection) => {
      if (currentSelection === null) {
        this.logger.error(
          `Not removing ${currentSelection} as it is null, consider reloading or deleting the entity in home-assistant.`,
        );
        return;
      }
      delete signals[currentSelection];
      this.persist({ signals, currentSelection: null });
      return cb();
    });
  }

  private persist(data: IRStoredCache) {
    this.internalCacheStore = data;
    datastore.put(this.storeCacheKey, JSON.stringify(this.internalCacheStore));
  }
}

export type IRState = ReturnType<typeof makeIRSharedState>;
export const makeIRSharedState = (logger: Logger) => {
  let isRecording: boolean = false;
  const signalStore = new IRSignalStore(logger);
  return {
    signalStore,
    isRecording() {
      return isRecording;
    },
    setRecordingState(newValue: boolean) {
      isRecording = newValue;
    },
  };
};
