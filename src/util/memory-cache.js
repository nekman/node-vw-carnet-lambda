export default class MemoryCache {
  constructor() {
    this.map = new Map();
  }

  set(key, value) {
    this.map.set(key, value);
  }

  get(key, defaultValue = null) {
    if (!this.has(key)) {
      return defaultValue;
    }

    return this.map.get(key);
  }

  has(key) {
    return this.map.has(key);
  }
}

export const Cache = new MemoryCache();
