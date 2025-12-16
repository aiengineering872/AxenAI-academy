// Mock LLM utility functions for frontend-only prompt engineering simulator

interface MockLLMConfig {
  basePrompt: string;
  rolePrompt?: string;
  temperature: number;
  topP: number;
}

// Generate a mock response based on prompt and parameters
export function generateMockResponse(config: MockLLMConfig): string {
  const { basePrompt, rolePrompt, temperature, topP } = config;
  
  // Combine role prompt and base prompt
  const fullPrompt = rolePrompt 
    ? `${rolePrompt}\n\nUser: ${basePrompt}\n\nAssistant:`
    : basePrompt;
  
  // Simulate temperature effect on response style
  const creativity = temperature;
  const diversity = topP;
  
  // Base response templates based on prompt type
  let response = '';
  
  // Detect prompt type and generate appropriate response
  const lowerPrompt = fullPrompt.toLowerCase();
  
  if (lowerPrompt.includes('essay') || lowerPrompt.includes('write') && lowerPrompt.includes('word')) {
    response = generateEssayResponse(basePrompt, creativity, diversity);
  } else if (lowerPrompt.includes('python') || lowerPrompt.includes('function') || lowerPrompt.includes('code')) {
    response = generateCodeResponse(basePrompt, creativity, diversity);
  } else if (lowerPrompt.includes('explain') || lowerPrompt.includes('how') || lowerPrompt.includes('what')) {
    response = generateExplanationResponse(basePrompt, creativity, diversity);
  } else if (lowerPrompt.includes('translate') || lowerPrompt.includes('translation')) {
    response = generateTranslationResponse(basePrompt, creativity, diversity);
  } else if (lowerPrompt.includes('summarize') || lowerPrompt.includes('summary')) {
    response = generateSummaryResponse(basePrompt, creativity, diversity);
  } else {
    response = generateGenericResponse(basePrompt, creativity, diversity);
  }
  
  // Apply temperature-based variations
  if (creativity > 1.0) {
    response = addCreativeVariations(response);
  } else if (creativity < 0.5) {
    response = makeMoreConservative(response);
  }
  
  return response;
}

// Generate essay response
function generateEssayResponse(prompt: string, creativity: number, diversity: number): string {
  const topics = prompt.match(/(?:about|on|regarding)\s+([^.]+)/i)?.[1] || 'the topic';
  
  const introVariations = [
    `In contemporary discourse, ${topics} has emerged as a pivotal subject of examination.`,
    `The exploration of ${topics} reveals profound implications for our understanding of modern society.`,
    `${topics} represents one of the most significant developments in recent times.`,
  ];
  
  const bodyVariations = [
    `First, it is essential to consider the multifaceted nature of this phenomenon. The implications extend beyond immediate concerns, touching upon fundamental questions about progress and adaptation.`,
    `Moreover, the transformative potential cannot be understated. As we navigate these changes, we must remain cognizant of both opportunities and challenges that arise.`,
    `Additionally, the interconnectedness of various factors creates a complex landscape that requires careful analysis and thoughtful consideration.`,
  ];
  
  const conclusionVariations = [
    `In conclusion, ${topics} demands our continued attention and thoughtful engagement as we move forward.`,
    `Ultimately, understanding ${topics} is crucial for navigating the complexities of our contemporary world.`,
    `To summarize, ${topics} presents both challenges and opportunities that will shape our collective future.`,
  ];
  
  const intro = introVariations[Math.floor(Math.random() * introVariations.length * diversity)];
  const body = bodyVariations[Math.floor(Math.random() * bodyVariations.length * diversity)];
  const conclusion = conclusionVariations[Math.floor(Math.random() * conclusionVariations.length * diversity)];
  
  return `${intro}\n\n${body}\n\n${body}\n\n${conclusion}`;
}

// Generate code response
function generateCodeResponse(prompt: string, creativity: number, diversity: number): string {
  if (prompt.toLowerCase().includes('factorial')) {
    return `def factorial(n):
    """
    Calculate the factorial of a number using recursion.
    
    Args:
        n (int): The number to calculate factorial for
    
    Returns:
        int: The factorial of n
    """
    # Base case: factorial of 0 or 1 is 1
    if n <= 1:
        return 1
    
    # Recursive case: n! = n * (n-1)!
    return n * factorial(n - 1)


# Example usage:
# result = factorial(5)  # Returns 120
# print(f"Factorial of 5 is {result}")`;
  }
  
  if (prompt.toLowerCase().includes('python')) {
    return `# Python solution based on your request

def solution():
    """
    Implementation based on the requirements.
    """
    # Add your logic here
    pass


# Usage example
if __name__ == "__main__":
    result = solution()
    print(result)`;
  }
  
  return `def solve():
    # Implementation here
    pass`;
}

// Generate explanation response
function generateExplanationResponse(prompt: string, creativity: number, diversity: number): string {
  const topic = prompt.match(/(?:explain|how|what).*?([^.]+)/i)?.[1] || 'this concept';
  
  const explanations = [
    `${topic} can be understood as a system that processes information through interconnected components. At its core, it involves the transmission and transformation of data across multiple layers.`,
    
    `To explain ${topic}, imagine a network where each element contributes to the overall function. Information flows from input to output, with each stage performing specific transformations.`,
    
    `${topic} works by breaking down complex processes into simpler, manageable steps. Each component has a specific role, and together they create a cohesive system that achieves the desired outcome.`,
  ];
  
  const selected = explanations[Math.floor(Math.random() * explanations.length * diversity)];
  
  return `${selected}\n\nKey points:\n• Understanding the fundamental principles\n• Recognizing the relationships between components\n• Appreciating the overall system architecture`;
}

// Generate translation response
function generateTranslationResponse(prompt: string, creativity: number, diversity: number): string {
  const textMatch = prompt.match(/"([^"]+)"/);
  const textToTranslate = textMatch ? textMatch[1] : 'Hello, how are you today?';
  
  const translations: Record<string, string> = {
    'Hello, how are you today?': 'Hola, ¿cómo estás hoy?',
    'hello': 'hola',
    'how are you': '¿cómo estás',
  };
  
  const translation = translations[textToTranslate] || 'Translation: ' + textToTranslate;
  
  return translation;
}

// Generate summary response
function generateSummaryResponse(prompt: string, creativity: number, diversity: number): string {
  return `Key Points Summary:

1. Main Topic: The central theme revolves around significant developments in the field.

2. Critical Findings: Research indicates several important trends and patterns that merit attention.

3. Implications: These developments have far-reaching consequences for various stakeholders.

4. Recommendations: Based on the analysis, several actionable steps can be identified.

Conclusion: The overall picture suggests a need for continued monitoring and adaptive strategies.`;
}

// Generate generic response
function generateGenericResponse(prompt: string, creativity: number, diversity: number): string {
  const responses = [
    `Based on your request, I'll provide a comprehensive response. The topic you've raised involves several important considerations that warrant careful examination.`,
    
    `I understand you're asking about this subject. Let me break it down into key components that will help clarify the matter.`,
    
    `This is an interesting question. To address it properly, we need to consider multiple perspectives and factors that contribute to a complete understanding.`,
  ];
  
  return responses[Math.floor(Math.random() * responses.length * diversity)] + 
    `\n\nHere's a structured approach:\n\n1. First, we examine the core concepts\n2. Then, we explore the relationships\n3. Finally, we consider practical applications`;
}

// Add creative variations to response
function addCreativeVariations(text: string): string {
  const synonyms: Record<string, string[]> = {
    'important': ['crucial', 'vital', 'paramount', 'essential'],
    'understand': ['comprehend', 'grasp', 'appreciate', 'fathom'],
    'example': ['instance', 'illustration', 'case in point', 'demonstration'],
  };
  
  let varied = text;
  Object.entries(synonyms).forEach(([word, alternatives]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (Math.random() > 0.5) {
      varied = varied.replace(regex, alternatives[Math.floor(Math.random() * alternatives.length)]);
    }
  });
  
  return varied;
}

// Make response more conservative
function makeMoreConservative(text: string): string {
  // Remove excessive punctuation and make language more formal
  return text
    .replace(/!/g, '.')
    .replace(/\?\?+/g, '?')
    .replace(/\.\.\.+/g, '.');
}

// Generate multiple variations of a response
export function generateVariations(config: MockLLMConfig, count: number): string[] {
  const variations: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Slightly vary temperature and topP for each variation
    const variedConfig = {
      ...config,
      temperature: config.temperature + (Math.random() - 0.5) * 0.3,
      topP: Math.min(1, config.topP + (Math.random() - 0.5) * 0.2),
    };
    
    variations.push(generateMockResponse(variedConfig));
  }
  
  return variations;
}

// Compare two responses
export function compareResponses(responseA: string, responseB: string): {
  similarity: number;
  differences: Array<{ type: 'added' | 'removed' | 'unchanged'; word: string }>;
} {
  const wordsA = responseA.toLowerCase().split(/\s+/);
  const wordsB = responseB.toLowerCase().split(/\s+/);
  
  // Simple word overlap calculation
  const setA = new Set(wordsA);
  const setB = new Set(wordsB);
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  const similarity = intersection.size / union.size;
  
  // Find differences
  const differences: Array<{ type: 'added' | 'removed' | 'unchanged'; word: string }> = [];
  
  wordsA.forEach(word => {
    if (!setB.has(word)) {
      differences.push({ type: 'removed', word });
    } else {
      differences.push({ type: 'unchanged', word });
    }
  });
  
  wordsB.forEach(word => {
    if (!setA.has(word)) {
      differences.push({ type: 'added', word });
    }
  });
  
  return { similarity, differences };
}


