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
 * Generate improved mock LLM response based on retrieved chunks
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

  // Determine response style based on parameters
  const isCreative = creativity > 0.7;
  const isVerbose = verbosity > 0.7;
  const isConcise = verbosity < 0.3;

  // Extract query intent and important words
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower
    .split(/\s+/)
    .filter(w => w.length > 2)
    .filter(w => !['the', 'is', 'are', 'was', 'were', 'what', 'who', 'when', 'where', 'why', 'how', 'which'].includes(w));
  
  // Check if query is a question
  const isQuestion = /^(what|who|when|where|why|how|which|is|are|does|do|can|could|will|would|explain|describe|tell|define|list)/i.test(query);

  // Find the most relevant content from each chunk
  const relevantContent: Array<{ text: string; score: number; chunkIndex: number }> = [];
  
  chunks.forEach((chunk, chunkIndex) => {
    const chunkText = chunk.text;
    const chunkLower = chunkText.toLowerCase();
    
    // Calculate relevance score for this chunk
    let chunkScore = 0;
    for (const word of queryWords) {
      const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
      const matches = chunkLower.match(wordRegex);
      if (matches) {
        chunkScore += matches.length * 2; // Weighted by frequency
      }
    }
    
    // Extract sentences from chunk
    const sentences = chunkText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 15 && s.length < 400);
    
    // Score each sentence by relevance
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase();
      let sentenceScore = chunkScore; // Start with chunk score
      
      // Boost score for query word matches in sentence
      for (const word of queryWords) {
        if (sentenceLower.includes(word)) {
          sentenceScore += 3;
        }
      }
      
      // Bonus for question words at sentence start
      if (isQuestion && /^(what|who|when|where|why|how|which|is|are|does|do|can|could|will|would)/i.test(sentence)) {
        sentenceScore += 2;
      }
      
      // Bonus for definitions/explanations
      if (/(is|are|means|refers to|defined as|consists of)/i.test(sentence)) {
        sentenceScore += 1;
      }
      
      if (sentenceScore > 0) {
        relevantContent.push({ text: sentence, score: sentenceScore, chunkIndex });
      }
    });
  });
  
  // Sort by relevance score and remove duplicates
  relevantContent.sort((a, b) => b.score - a.score);
  
  // Remove similar sentences (avoid repetition)
  const uniqueContent: string[] = [];
  const seenTexts = new Set<string>();
  
  for (const item of relevantContent) {
    const normalized = item.text.toLowerCase().substring(0, 50);
    if (!seenTexts.has(normalized)) {
      seenTexts.add(normalized);
      uniqueContent.push(item.text);
      
      // Limit based on verbosity
      const maxSentences = isVerbose ? 5 : isConcise ? 1 : 3;
      if (uniqueContent.length >= maxSentences) break;
    }
  }
  
  // If no relevant content found, use first chunk
  if (uniqueContent.length === 0) {
    const firstChunk = chunks[0].text;
    const sentences = firstChunk.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    uniqueContent.push(...sentences.slice(0, isVerbose ? 3 : isConcise ? 1 : 2));
  }
  
  // Build response
  let response = '';
  
  if (isQuestion) {
    // For questions, provide direct answer
    if (isCreative) {
      response = 'Based on the provided context, ';
    }
    
    // Combine sentences intelligently
    response += uniqueContent
      .join(isVerbose ? ' Furthermore, ' : '. ')
      .replace(/\s+/g, ' ')
      .trim();
      
    // Ensure proper sentence ending
    if (!response.match(/[.!?]$/)) {
      response += '.';
    }
  } else {
    // For statements/commands
    const intro = isCreative
      ? 'Based on the information provided: '
      : 'According to the context: ';
    
    response = intro + uniqueContent
      .join(isVerbose ? ' Additionally, ' : '. ')
      .replace(/\s+/g, ' ')
      .trim();
      
    if (!response.match(/[.!?]$/)) {
      response += '.';
    }
  }
  
  // Add verbosity details
  if (isVerbose && chunks.length > 1) {
    response += `\n\nThis answer is based on ${chunks.length} relevant section${chunks.length > 1 ? 's' : ''} from the document.`;
  }
  
  // Apply conciseness
  if (isConcise && response.length > 150) {
    response = response.substring(0, 147) + '...';
  }
  
  return response.trim();
}

