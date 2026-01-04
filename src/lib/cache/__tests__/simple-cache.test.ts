import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";

import { SimpleCache, generateCacheKey } from "../simple-cache";

describe("SimpleCache", () => {
  let cache: SimpleCache<string>;

  beforeEach(() => {
    cache = new SimpleCache<string>(1000); // 1 second TTL for tests
  });

  afterEach(() => {
    cache.destroy();
  });

  describe("basic operations", () => {
    it("stores and retrieves values", () => {
      cache.set("key1", "value1");
      expect(cache.get("key1")).toBe("value1");
    });

    it("returns null for non-existent keys", () => {
      expect(cache.get("nonexistent")).toBeNull();
    });

    it("checks if key exists", () => {
      cache.set("key1", "value1");
      expect(cache.has("key1")).toBe(true);
      expect(cache.has("key2")).toBe(false);
    });

    it("deletes keys", () => {
      cache.set("key1", "value1");
      expect(cache.delete("key1")).toBe(true);
      expect(cache.get("key1")).toBeNull();
      expect(cache.delete("key1")).toBe(false); // Already deleted
    });

    it("clears all entries", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      cache.clear();
      expect(cache.get("key1")).toBeNull();
      expect(cache.get("key2")).toBeNull();
    });
  });

  describe("TTL and expiration", () => {
    it("expires entries after TTL", async () => {
      cache.set("key1", "value1", 100); // 100ms TTL
      expect(cache.get("key1")).toBe("value1");

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.get("key1")).toBeNull();
    });

    it("uses default TTL when not specified", async () => {
      const shortCache = new SimpleCache<string>(100);
      shortCache.set("key1", "value1");
      expect(shortCache.get("key1")).toBe("value1");

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(shortCache.get("key1")).toBeNull();
      shortCache.destroy();
    });

    it("has() returns false for expired entries", async () => {
      cache.set("key1", "value1", 100);
      expect(cache.has("key1")).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.has("key1")).toBe(false);
    });
  });

  describe("stats", () => {
    it("reports cache size", () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");
      const stats = cache.stats();
      expect(stats.size).toBe(2);
    });

    it("reports expired entries", async () => {
      cache.set("key1", "value1", 100);
      cache.set("key2", "value2", 10000);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const stats = cache.stats();
      expect(stats.size).toBe(2); // Both still in map
      expect(stats.expired).toBe(1); // One expired
    });
  });

  describe("type safety", () => {
    it("works with different types", () => {
      const numberCache = new SimpleCache<number>();
      numberCache.set("key1", 42);
      expect(numberCache.get("key1")).toBe(42);
      numberCache.destroy();

      const objectCache = new SimpleCache<{ name: string }>();
      objectCache.set("key1", { name: "test" });
      expect(objectCache.get("key1")).toEqual({ name: "test" });
      objectCache.destroy();
    });
  });

  describe("cleanup", () => {
    it("removes expired entries during periodic cleanup", async () => {
      const cleanupCache = new SimpleCache<string>(100);
      cleanupCache.set("key1", "value1", 100);
      cleanupCache.set("key2", "value2", 10000);

      // Wait for expiration + cleanup interval
      await new Promise((resolve) => setTimeout(resolve, 61000));

      const stats = cleanupCache.stats();
      // Cleanup should have removed expired entry
      expect(stats.size).toBeLessThan(2);
      cleanupCache.destroy();
    }, 62000); // Increase test timeout

    it("stops cleanup on destroy", () => {
      const testCache = new SimpleCache<string>();
      testCache.set("key1", "value1");
      testCache.destroy();
      expect(testCache.get("key1")).toBeNull(); // Cache cleared
    });
  });
});

describe("generateCacheKey", () => {
  it("generates consistent keys for same params", () => {
    const key1 = generateCacheKey({ a: 1, b: "test" });
    const key2 = generateCacheKey({ a: 1, b: "test" });
    expect(key1).toBe(key2);
  });

  it("generates different keys for different params", () => {
    const key1 = generateCacheKey({ a: 1, b: "test" });
    const key2 = generateCacheKey({ a: 2, b: "test" });
    expect(key1).not.toBe(key2);
  });

  it("handles params in different order", () => {
    const key1 = generateCacheKey({ a: 1, b: "test" });
    const key2 = generateCacheKey({ b: "test", a: 1 });
    expect(key1).toBe(key2); // Should be same despite different order
  });

  it("handles arrays", () => {
    const key1 = generateCacheKey({ waypoints: ["A", "B"] });
    const key2 = generateCacheKey({ waypoints: ["A", "B"] });
    expect(key1).toBe(key2);
  });

  it("handles empty objects", () => {
    const key = generateCacheKey({});
    expect(key).toBe("");
  });

  it("handles complex nested objects", () => {
    const key1 = generateCacheKey({ nested: { a: 1, b: { c: 2 } } });
    const key2 = generateCacheKey({ nested: { a: 1, b: { c: 2 } } });
    expect(key1).toBe(key2);
  });
});
