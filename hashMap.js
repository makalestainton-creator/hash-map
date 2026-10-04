export class HashMap {
  constructor(capacity = 16, loadFactor = 0.75) {
    this.capacity = capacity;
    this.loadFactor = loadFactor;
    this.size = 0;

    this.buckets = Array.from({ length: capacity }, () => []);
  }

  #getBucket(key) {
    const index = this.hash(key);

    if (index < 0 || index >= this.buckets.length) {
      throw new Error("Trying to access index out of bounds");
    }

    if (typeof key !== "string") throw new TypeError("Keys must be strings");

    return this.buckets[index];
  }

  hash(key) {
    let hashCode = 0;
    const primeNumber = 31;

    for (let i = 0; i < key.length; i++) {
      hashCode = (primeNumber * hashCode + key.charCodeAt(i)) % this.capacity;
    }

    return hashCode;
  }

  set(key, value) {
    const bucket = this.#getBucket(key);

    for (const entry of bucket) {
      if (entry.key === key) {
        entry.value = value;
        return;
      }
    }

    bucket.push({ key, value });
    this.size++;

    if (this.size / this.capacity > this.loadFactor) this.resize();
  }

  get(key) {
    const bucket = this.#getBucket(key);

    for (const entry of bucket) {
      if (entry.key === key) return entry.value;
    }

    return undefined;
  }

  has(key) {
    return this.#getBucket(key).some((entry) => entry.key === key);
  }

  remove(key) {
    const bucket = this.#getBucket(key);

    const i = bucket.findIndex((entry) => entry.key === key);
    if (i === -1) return false;

    bucket.splice(i, 1);
    this.size--;
    return true;
  }

  resize() {
    const oldBuckets = this.buckets;
    this.capacity *= 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.size = 0;

    for (const bucket of oldBuckets) {
      for (const { key, value } of bucket) {
        this.set(key, value);
      }
    }
  }

  length() {
    return this.size;
  }

  clear() {
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.size = 0;
  }

  keys() {
    return this.entries().map(([key]) => key);
  }

  values() {
    return this.entries().map(([, value]) => value);
  }

  entries() {
    const entries = [];

    for (const bucket of this.buckets) {
      for (const { key, value } of bucket) {
        entries.push([key, value]);
      }
    }

    return entries;
  }
}
