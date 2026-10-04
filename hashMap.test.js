import { HashMap } from "./hashMap.js";

// The 12 pairs from the lesson's test script.
const lessonPairs = [
  ["apple", "red"],
  ["banana", "yellow"],
  ["carrot", "orange"],
  ["dog", "brown"],
  ["elephant", "gray"],
  ["frog", "green"],
  ["grape", "purple"],
  ["hat", "black"],
  ["ice cream", "white"],
  ["jacket", "blue"],
  ["kite", "pink"],
  ["lion", "golden"],
];

// Builds a map and sets every [key, value] pair into it.
const makeMap = (pairs = []) => {
  const map = new HashMap();
  pairs.forEach(([key, value]) => map.set(key, value));
  return map;
};

// A hash map does not keep insertion order, so sort before comparing.
const sortStrings = (list) => [...list].sort();
const sortPairs = (pairs) =>
  [...pairs].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

// Finds two different keys that land in the same bucket of this map.
// (With 16 buckets, 17 keys are enough to guarantee a collision.)
const findCollidingKeys = (map) => {
  const seen = new Map();
  for (let i = 0; ; i++) {
    const key = `key${i}`;
    const index = map.hash(key);
    if (seen.has(index)) return [seen.get(index), key];
    seen.set(index, key);
  }
};

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

describe("HashMap", () => {
  describe("constructor", () => {
    test("starts empty", () => {
      const map = new HashMap();
      expect(map.length()).toBe(0);
      expect(map.keys()).toEqual([]);
      expect(map.values()).toEqual([]);
      expect(map.entries()).toEqual([]);
    });

    test("defaults to capacity 16 and load factor 0.75", () => {
      const map = new HashMap();
      expect(map.capacity).toBe(16);
      expect(map.loadFactor).toBe(0.75);
    });

    test("takes capacity first, then load factor", () => {
      const map = new HashMap(32, 0.5);
      expect(map.capacity).toBe(32);
      expect(map.loadFactor).toBe(0.5);
    });
  });

  describe("hash()", () => {
    test("returns an integer", () => {
      expect(Number.isInteger(new HashMap().hash("apple"))).toBe(true);
    });

    test("gives the same result for the same key every time", () => {
      const map = new HashMap();
      expect(map.hash("apple")).toBe(map.hash("apple"));
    });

    test("always stays within 0 and capacity - 1", () => {
      const map = new HashMap();
      for (let i = 0; i < 1000; i++) {
        const index = map.hash(`key-${i}`);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(map.capacity);
      }
    });

    test("handles very long keys without overflowing", () => {
      const map = new HashMap();
      const index = map.hash("a".repeat(10000));
      expect(Number.isInteger(index)).toBe(true);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(map.capacity);
    });

    test("handles an empty string", () => {
      const map = new HashMap();
      const index = map.hash("");
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(map.capacity);
    });

    test("spreads different keys over many buckets", () => {
      const map = new HashMap();
      const used = new Set();
      for (let i = 0; i < 200; i++) used.add(map.hash(`key-${i}`));
      expect(used.size).toBeGreaterThan(8);
    });
  });

  describe("set()", () => {
    test("adds a new key", () => {
      const map = new HashMap();
      map.set("apple", "red");
      expect(map.get("apple")).toBe("red");
      expect(map.length()).toBe(1);
    });

    test("overwrites the value of an existing key", () => {
      const map = makeMap([["apple", "red"]]);
      map.set("apple", "green");
      expect(map.get("apple")).toBe("green");
    });

    test("overwriting does not add a second entry", () => {
      const map = makeMap([["apple", "red"]]);
      map.set("apple", "green");
      map.set("apple", "yellow");
      expect(map.length()).toBe(1);
      expect(map.entries()).toEqual([["apple", "yellow"]]);
    });

    test("stores many different keys", () => {
      const map = new HashMap();
      for (let i = 0; i < 50; i++) map.set(`key${i}`, i);
      expect(map.length()).toBe(50);
      for (let i = 0; i < 50; i++) expect(map.get(`key${i}`)).toBe(i);
    });

    test("keeps both keys when two keys collide", () => {
      const map = new HashMap();
      const [first, second] = findCollidingKeys(map);
      map.set(first, "one");
      map.set(second, "two");
      expect(map.get(first)).toBe("one");
      expect(map.get(second)).toBe("two");
      expect(map.length()).toBe(2);
    });

    test("overwriting one colliding key leaves the other alone", () => {
      const map = new HashMap();
      const [first, second] = findCollidingKeys(map);
      map.set(first, "one");
      map.set(second, "two");
      map.set(first, "uno");
      expect(map.get(first)).toBe("uno");
      expect(map.get(second)).toBe("two");
      expect(map.length()).toBe(2);
    });

    test("treats keys as case-sensitive", () => {
      const map = makeMap([
        ["apple", "lower"],
        ["Apple", "upper"],
      ]);
      expect(map.get("apple")).toBe("lower");
      expect(map.get("Apple")).toBe("upper");
      expect(map.length()).toBe(2);
    });

    test("accepts keys with spaces", () => {
      const map = makeMap([["ice cream", "white"]]);
      expect(map.get("ice cream")).toBe("white");
    });

    test.each([
      ["a number", 0],
      ["false", false],
      ["an empty string", ""],
      ["null", null],
      ["an array", [1, 2, 3]],
      ["an object", { color: "red" }],
    ])("stores %s as a value", (_label, value) => {
      const map = makeMap([["key", value]]);
      expect(map.get("key")).toEqual(value);
      expect(map.has("key")).toBe(true);
    });
  });

  describe("get()", () => {
    test("returns the value for an existing key", () => {
      expect(makeMap([["apple", "red"]]).get("apple")).toBe("red");
    });

    test("returns undefined for a missing key", () => {
      expect(makeMap([["apple", "red"]]).get("bed")).toBeUndefined();
    });

    test("returns undefined on an empty map", () => {
      expect(new HashMap().get("apple")).toBeUndefined();
    });

    test("returns undefined after the key was removed", () => {
      const map = makeMap([["apple", "red"]]);
      map.remove("apple");
      expect(map.get("apple")).toBeUndefined();
    });
  });

  describe("has()", () => {
    test("returns true for an existing key", () => {
      expect(makeMap([["apple", "red"]]).has("apple")).toBe(true);
    });

    test("returns false for a missing key", () => {
      expect(makeMap([["apple", "red"]]).has("bed")).toBe(false);
    });

    test("returns false on an empty map", () => {
      expect(new HashMap().has("apple")).toBe(false);
    });

    test("returns false after the key was removed", () => {
      const map = makeMap([["apple", "red"]]);
      map.remove("apple");
      expect(map.has("apple")).toBe(false);
    });

    test("returns true even when the stored value is falsy", () => {
      const map = makeMap([
        ["zero", 0],
        ["nothing", undefined],
      ]);
      expect(map.has("zero")).toBe(true);
      expect(map.has("nothing")).toBe(true);
    });
  });

  describe("remove()", () => {
    test("returns true and removes an existing key", () => {
      const map = makeMap(lessonPairs);
      expect(map.remove("apple")).toBe(true);
      expect(map.has("apple")).toBe(false);
      expect(map.length()).toBe(11);
    });

    test("returns false for a missing key", () => {
      const map = makeMap(lessonPairs);
      expect(map.remove("bed")).toBe(false);
      expect(map.length()).toBe(12);
    });

    test("returns false on an empty map", () => {
      expect(new HashMap().remove("apple")).toBe(false);
    });

    test("returns false when the same key is removed twice", () => {
      const map = makeMap([["apple", "red"]]);
      expect(map.remove("apple")).toBe(true);
      expect(map.remove("apple")).toBe(false);
      expect(map.length()).toBe(0);
    });

    test("leaves the other keys untouched", () => {
      const map = makeMap(lessonPairs);
      map.remove("apple");
      expect(map.get("banana")).toBe("yellow");
      expect(map.get("lion")).toBe("golden");
    });

    test("removing one colliding key keeps the other", () => {
      const map = new HashMap();
      const [first, second] = findCollidingKeys(map);
      map.set(first, "one");
      map.set(second, "two");
      expect(map.remove(first)).toBe(true);
      expect(map.has(first)).toBe(false);
      expect(map.get(second)).toBe("two");
      expect(map.length()).toBe(1);
    });

    test("allows the key to be added again", () => {
      const map = makeMap([["apple", "red"]]);
      map.remove("apple");
      map.set("apple", "green");
      expect(map.get("apple")).toBe("green");
      expect(map.length()).toBe(1);
    });
  });

  describe("length()", () => {
    test("is 0 for a new map", () => {
      expect(new HashMap().length()).toBe(0);
    });

    test("goes up by one for each new key", () => {
      const map = new HashMap();
      map.set("a", 1);
      expect(map.length()).toBe(1);
      map.set("b", 2);
      expect(map.length()).toBe(2);
    });

    test("does not change when a key is overwritten", () => {
      const map = makeMap([["a", 1]]);
      map.set("a", 2);
      expect(map.length()).toBe(1);
    });

    test("goes down when a key is removed, not when a removal fails", () => {
      const map = makeMap([
        ["a", 1],
        ["b", 2],
      ]);
      map.remove("a");
      expect(map.length()).toBe(1);
      map.remove("missing");
      expect(map.length()).toBe(1);
    });

    test("counts every key of the lesson data", () => {
      expect(makeMap(lessonPairs).length()).toBe(12);
    });
  });

  describe("clear()", () => {
    test("removes every entry", () => {
      const map = makeMap(lessonPairs);
      map.clear();
      expect(map.length()).toBe(0);
      expect(map.keys()).toEqual([]);
      expect(map.values()).toEqual([]);
      expect(map.entries()).toEqual([]);
      expect(map.get("apple")).toBeUndefined();
      expect(map.has("apple")).toBe(false);
    });

    test("works on an empty map and can be called twice", () => {
      const map = new HashMap();
      map.clear();
      map.clear();
      expect(map.length()).toBe(0);
    });

    test("leaves a map that still works", () => {
      const map = makeMap(lessonPairs);
      map.clear();
      map.set("apple", "green");
      expect(map.get("apple")).toBe("green");
      expect(map.length()).toBe(1);
    });

    test("resets the internal count so it does not resize too early", () => {
      const map = makeMap(lessonPairs); // 12 entries, capacity 16
      const capacityBefore = map.capacity;
      map.clear();
      map.set("apple", "red");
      expect(map.length()).toBe(1);
      expect(map.capacity).toBe(capacityBefore);
    });
  });

  describe("keys()", () => {
    test("returns every key and no values", () => {
      const map = makeMap(lessonPairs);
      expect(sortStrings(map.keys())).toEqual(
        sortStrings(lessonPairs.map(([key]) => key)),
      );
    });

    test("returns an empty array for an empty map", () => {
      expect(new HashMap().keys()).toEqual([]);
    });

    test("lists an overwritten key only once", () => {
      const map = makeMap([["a", 1]]);
      map.set("a", 2);
      expect(map.keys()).toEqual(["a"]);
    });

    test("returns a copy, so changing it does not change the map", () => {
      const map = makeMap([["a", 1]]);
      map.keys().push("hacked");
      expect(map.keys()).toEqual(["a"]);
      expect(map.length()).toBe(1);
    });
  });

  describe("values()", () => {
    test("returns every value and no keys", () => {
      const map = makeMap(lessonPairs);
      expect(sortStrings(map.values())).toEqual(
        sortStrings(lessonPairs.map(([, value]) => value)),
      );
    });

    test("returns an empty array for an empty map", () => {
      expect(new HashMap().values()).toEqual([]);
    });

    test("keeps duplicate values from different keys", () => {
      const map = makeMap([
        ["apple", "red"],
        ["cherry", "red"],
      ]);
      expect(map.values()).toEqual(["red", "red"]);
    });

    test("shows the new value after an overwrite", () => {
      const map = makeMap([["a", 1]]);
      map.set("a", 2);
      expect(map.values()).toEqual([2]);
    });
  });

  describe("entries()", () => {
    test("returns each key-value pair as its own [key, value] array", () => {
      const map = makeMap([
        ["apple", "red"],
        ["banana", "yellow"],
      ]);
      expect(sortPairs(map.entries())).toEqual([
        ["apple", "red"],
        ["banana", "yellow"],
      ]);
    });

    test("every entry is an array of exactly two items", () => {
      const entries = makeMap(lessonPairs).entries();
      entries.forEach((entry) => {
        expect(Array.isArray(entry)).toBe(true);
        expect(entry).toHaveLength(2);
      });
    });

    test("contains every pair of the lesson data", () => {
      expect(sortPairs(makeMap(lessonPairs).entries())).toEqual(
        sortPairs(lessonPairs),
      );
    });

    test("has as many entries as length()", () => {
      const map = makeMap(lessonPairs);
      expect(map.entries()).toHaveLength(map.length());
    });

    test("returns an empty array for an empty map", () => {
      expect(new HashMap().entries()).toEqual([]);
    });

    test("shows the new value after an overwrite, without duplicates", () => {
      const map = makeMap([["a", 1]]);
      map.set("a", 2);
      expect(map.entries()).toEqual([["a", 2]]);
    });

    test("agrees with keys() and values()", () => {
      const map = makeMap(lessonPairs);
      const entries = map.entries();
      expect(sortStrings(entries.map(([key]) => key))).toEqual(
        sortStrings(map.keys()),
      );
      expect(sortStrings(entries.map(([, value]) => value))).toEqual(
        sortStrings(map.values()),
      );
    });
  });

  describe("growth (load factor and capacity)", () => {
    test("does not grow at exactly the load factor (12 of 16)", () => {
      const map = makeMap(lessonPairs);
      expect(map.length()).toBe(12);
      expect(map.capacity).toBe(16);
    });

    test("overwriting while full does not grow the map or add entries", () => {
      const map = makeMap(lessonPairs);
      map.set("kite", "red");
      map.set("apple", "green");
      expect(map.length()).toBe(12);
      expect(map.capacity).toBe(16);
    });

    test("the 13th key doubles the capacity", () => {
      const map = makeMap(lessonPairs);
      map.set("moon", "silver");
      expect(map.capacity).toBe(32);
      expect(map.length()).toBe(13);
    });

    test("every entry is still found after growing", () => {
      const map = makeMap(lessonPairs);
      map.set("moon", "silver");
      lessonPairs.forEach(([key, value]) => {
        expect(map.get(key)).toBe(value);
      });
      expect(map.get("moon")).toBe("silver");
    });

    test("the load drops below the load factor after growing", () => {
      const map = makeMap(lessonPairs);
      map.set("moon", "silver");
      expect(map.length() / map.capacity).toBeLessThan(map.loadFactor);
    });

    test("overwriting after growing changes values, not the count", () => {
      const map = makeMap(lessonPairs);
      map.set("moon", "silver");
      map.set("kite", "red");
      map.set("moon", "white");
      expect(map.get("kite")).toBe("red");
      expect(map.get("moon")).toBe("white");
      expect(map.length()).toBe(13);
      expect(map.capacity).toBe(32);
    });

    test("keeps growing as more keys are added", () => {
      const map = new HashMap();
      for (let i = 0; i < 100; i++) map.set(`key${i}`, i);

      expect(map.length()).toBe(100);
      expect(map.length() / map.capacity).toBeLessThanOrEqual(map.loadFactor);
      // capacity is always 16 doubled some number of times
      expect(Number.isInteger(Math.log2(map.capacity / 16))).toBe(true);
      for (let i = 0; i < 100; i++) expect(map.get(`key${i}`)).toBe(i);
    });

    test("spreads entries across buckets instead of piling them up", () => {
      const map = new HashMap();
      for (let i = 0; i < 100; i++) map.set(`key${i}`, i);
      const longest = Math.max(...map.buckets.map((bucket) => bucket.length));
      expect(longest).toBeLessThanOrEqual(8);
    });

    test("remove, has and clear still work after growing", () => {
      const map = makeMap(lessonPairs);
      map.set("moon", "silver");

      expect(map.remove("apple")).toBe(true);
      expect(map.has("apple")).toBe(false);
      expect(map.length()).toBe(12);

      map.clear();
      expect(map.length()).toBe(0);
      expect(map.entries()).toEqual([]);
    });
  });

  describe("out-of-bounds guard", () => {
    test.each([
      ["negative", -1],
      ["equal to the capacity", 16],
      ["far too large", 999],
    ])("throws when the bucket index is %s", (_label, badIndex) => {
      const map = new HashMap();
      map.hash = () => badIndex; // force a bad index

      const message = "Trying to access index out of bounds";
      expect(() => map.set("a", 1)).toThrow(message);
      expect(() => map.get("a")).toThrow(message);
      expect(() => map.has("a")).toThrow(message);
      expect(() => map.remove("a")).toThrow(message);
    });
  });

  describe("the lesson's walkthrough", () => {
    test("populate, overwrite, grow, then use every method", () => {
      const test = makeMap(lessonPairs);
      expect(test.length()).toBe(12);
      expect(test.capacity).toBe(16);

      // overwrite while full: no growth
      test.set("kite", "red");
      test.set("lion", "yellow");
      expect(test.length()).toBe(12);
      expect(test.capacity).toBe(16);

      // the 13th key triggers growth
      test.set("moon", "silver");
      expect(test.length()).toBe(13);
      expect(test.capacity).toBe(32);

      // other methods after growing
      expect(test.get("apple")).toBe("red");
      expect(test.get("kite")).toBe("red");
      expect(test.get("lion")).toBe("yellow");
      expect(test.has("bed")).toBe(false);
      expect(test.has("moon")).toBe(true);
      expect(test.remove("apple")).toBe(true);
      expect(test.remove("apple")).toBe(false);
      expect(test.length()).toBe(12);
      expect(test.keys()).toHaveLength(12);
      expect(test.values()).toHaveLength(12);
      expect(test.entries()).toHaveLength(12);
      expect(test.entries()[0]).toHaveLength(2);

      test.clear();
      expect(test.length()).toBe(0);
    });
  });
});
