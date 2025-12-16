// RAG Simulator utility functions for frontend-only RAG pipeline visualization

export interface Chunk {
  id: number;
  text: string;
  embedding: number[];
}

export interface SearchResult {
  chunk: Chunk;
  similarity: number;
  rank: number;
}

/**
 * Chunk text into smaller pieces with overlap
 */
export function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): Chunk[] {
  const words = text.split(/\s+/);
  const chunks: Chunk[] = [];
  let chunkId = 0;

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkText = chunkWords.join(' ');

    if (chunkText.trim().length > 0) {
      chunks.push({
        id: chunkId++,
        text: chunkText.trim(),
        embedding: [], // Will be generated later
      });
    }

    // Stop if we've reached the end
    if (i + chunkSize >= words.length) {
      break;
    }
  }

  return chunks;
}

/**
 * Generate deterministic embeddings for chunks using hash-based approach
 */
export function generateChunkEmbeddings(
  chunks: Chunk[],
  dimensions: number
): Chunk[] {
  return chunks.map((chunk) => {
    const embedding = generateEmbedding(chunk.text, dimensions);
    return {
      ...chunk,
      embedding,
    };
  });
}

/**
 * Generate a deterministic embedding vector for text
 */
function generateEmbedding(text: string, dimensions: number): number[] {
  const embedding: number[] = [];
  const words = text.toLowerCase().split(/\s+/);

  // Simple hash-based embedding generation
  for (let i = 0; i < dimensions; i++) {
    let hash = 0;
    const seed = i * 31;

    for (const word of words) {
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash + word.charCodeAt(j) + seed) | 0;
      }
    }

    // Normalize to [-1, 1] range
    const value = Math.sin(hash) * 0.5;
    embedding.push(value);
  }

  return embedding;
}

/**
 * Generate embedding for a query
 */
function generateQueryEmbedding(query: string, dimensions: number): number[] {
  return generateEmbedding(query, dimensions);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Search chunks using vector similarity
 */
export function searchChunks(
  query: string,
  chunks: Chunk[],
  topK: number
): SearchResult[] {
  if (chunks.length === 0 || !query.trim()) {
    return [];
  }

  // Generate query embedding
  const queryEmbedding = generateQueryEmbedding(
    query,
    chunks[0].embedding.length
  );

  // Calculate similarities
  const results: SearchResult[] = chunks
    .map((chunk) => {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);
      return {
        chunk,
        similarity: Math.max(0, similarity), // Ensure non-negative
        rank: 0, // Will be set after sorting
      };
    })
    .filter((result) => result.similarity > 0) // Filter out zero similarity
    .sort((a, b) => b.similarity - a.similarity) // Sort by similarity descending
    .slice(0, topK) // Take top K
    .map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

  return results;
}

/**
 * Build context prompt for LLM
 */
export function buildContextPrompt(
  systemPrompt: string,
  chunks: Chunk[],
  query: string
): string {
  const contextSections = chunks
    .map((chunk, index) => `[Chunk ${index + 1}]\n${chunk.text}`)
    .join('\n\n');

  return `SYSTEM: ${systemPrompt}

CONTEXT:
${contextSections}

USER: ${query}`;
}

/**
 * Generate mock LLM response based on retrieved chunks
 */
export function generateMockLLMResponse(
  query: string,
  chunks: Chunk[],
  creativity: number,
  verbosity: number
): string {
  if (chunks.length === 0) {
    return 'I cannot answer this question based on the provided context.';
  }

  // Combine chunk texts
  const context = chunks.map((c) => c.text).join(' ');

  // Determine response style based on parameters
  const isCreative = creativity > 0.7;
  const isVerbose = verbosity > 0.7;
  const isConcise = verbosity < 0.3;

  // Simple keyword matching to generate relevant response
  const queryLower = query.toLowerCase();
  const contextLower = context.toLowerCase();

  // Extract relevant sentences from context
  const sentences = context.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const relevantSentences = sentences
    .filter((sentence) => {
      const sentenceLower = sentence.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 3);
      return queryWords.some((word) => sentenceLower.includes(word));
    })
    .slice(0, isVerbose ? 5 : isConcise ? 1 : 3);

  if (relevantSentences.length === 0) {
    // Fallback response
    const intro = isCreative
      ? 'Based on the provided context, I can share the following insights:'
      : 'According to the context:';
    const mainContent = chunks[0].text.substring(0, 200);
    return `${intro}\n\n${mainContent}${isVerbose ? '\n\nThis information is relevant to your question.' : ''}`;
  }

  // Build response
  let response = '';

  if (isCreative) {
    response += 'Based on the information provided, ';
  } else {
    response += 'According to the context, ';
  }

  response += relevantSentences.join(isVerbose ? ' Additionally, ' : '. ');

  if (isVerbose && chunks.length > 1) {
    response += `\n\nThis information is drawn from ${chunks.length} relevant sections of the document.`;
  }

  if (isConcise) {
    response = response.substring(0, 150) + '...';
  }

  return response.trim();
}

