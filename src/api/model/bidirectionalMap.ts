export class BidirectionalMap<K, V> {
  private map: Map<K, V> = new Map();
  private reverseMap: Map<V, K> = new Map();

  // Add a kvp to the map.
  add(key: K, value: V): void {
    this.map.set(key, value);
    this.reverseMap.set(value, key);
  }

  // Get the value associated with a key.
  getValue(key: K): V | undefined {
    return this.map.get(key);
  }

  // Get the key associated with a value.
  getKey(value: V): K | undefined {
    return this.reverseMap.get(value);
  }
}
