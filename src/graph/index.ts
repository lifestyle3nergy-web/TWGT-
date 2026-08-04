// src/graph/index.ts — knowledge graph / vector store adapter (skeleton)

export interface KGOptions {
  url?: string;
}

export class KnowledgeGraph {
  url: string;
  constructor(opts: KGOptions = {}) {
    this.url = opts.url || process.env.QDRANT_URL || 'http://localhost:6333';
  }

  async upsertVectors(items: Array<{ id: string; vector: number[]; payload?: any }>) {
    // TODO: implement Qdrant / vector DB upsert
    console.log('upsertVectors', items.length);
    return { ok: true };
  }

  async queryVector(vector: number[], topK = 10) {
    // TODO: implement vector search
    return [];
  }
}
