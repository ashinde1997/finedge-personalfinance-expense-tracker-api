// simple in-memory cache with TTL support
// i'm using this in the /summary route so we don't recompute everything on every request

class CacheService {
  constructor() {
    this.store = new Map();
  }

  // store a value with an expiry time
  set(key, value, ttlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.store.set(key, { value, expiresAt });
  }

  // get a value - returns null if it expired or doesn't exist
  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  // remove a specific key
  invalidate(key) {
    this.store.delete(key);
  }

  // wipe everything
  flush() {
    this.store.clear();
  }

  has(key) {
    return this.get(key) !== null;
  }

  // just for debugging - shows how many entries are alive vs expired
  stats() {
    const now = Date.now();
    let active = 0;
    let expired = 0;

    for (const [, entry] of this.store) {
      if (now > entry.expiresAt) expired++;
      else active++;
    }
    return { total: this.store.size, active, expired };
  }
}

// export a single shared instance
const cache = new CacheService();


module.exports = cache;
