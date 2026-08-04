// src/memory/index.ts — semantic memory skeleton

export class MemoryStore {
  // In-memory placeholder — replace with persistent DB
  private store: Record<string, any[]> = {};

  async add(sessionId: string, item: any) {
    this.store[sessionId] = this.store[sessionId] || [];
    this.store[sessionId].push(item);
  }

  async get(sessionId: string) {
    return this.store[sessionId] || [];
  }

  async clear(sessionId: string) {
    this.store[sessionId] = [];
  }
}
