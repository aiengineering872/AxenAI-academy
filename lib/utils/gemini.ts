export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const generateGeminiResponse = async (
  prompt: string,
  context?: string,
  conversationHistory?: GeminiMessage[],
  apiKey?: string
): Promise<string> => {
  // Only run on client side
  if (typeof window === 'undefined') {
    throw new Error('Gemini API can only be called from the client side.');
  }

  // Get API key from parameter only (users must add their own API key in API Integration tab)
  // No fallback to environment variable - users bring their own keys
  if (!apiKey) {
    console.error('Gemini API key missing. Please add your Gemini API key in the API Integration tab.');
    throw new Error('Gemini API key not configured. Please add your Gemini API key in the API Integration tab (service: Gemini or Google).');
  }
  
  const finalApiKey = apiKey;

  console.log('Using Gemini API key:', finalApiKey ? `${finalApiKey.substring(0, 10)}...` : 'missing');
  
  // Verify API key format (should start with AIza)
  if (finalApiKey && !finalApiKey.startsWith('AIza')) {
    console.warn('API key format looks incorrect. Gemini API keys usually start with "AIza"');
  }

  // Build conversation history if provided
  const contents: any[] = [];
  
  // Add system context as first message if provided
  if (context) {
    contents.push({
      role: 'user',
      parts: [{ text: context }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'I understand. I\'m ready to help with AI Engineering questions, course content, code, FAQs, and anything related to the platform.' }]
    });
  }
  
  // Add conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    contents.push(...conversationHistory);
  }
  
  // Add current user prompt
  contents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  try {
    // First, list available models to see what's actually accessible
    console.log('🔍 Listing available Gemini models...');
    let availableModels: string[] = [];
    
    try {
      // Try v1beta first
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${finalApiKey}`;
      const listResponse = await fetch(listUrl);
      if (listResponse.ok) {
        const listData = await listResponse.json();
        if (listData.models && listData.models.length > 0) {
          availableModels = listData.models
            .map((m: any) => m.name?.replace('models/', '') || '')
            .filter((name: string) => name && name.includes('gemini'));
          console.log('✅ Available models (v1beta):', availableModels);
        }
      }
    } catch (e) {
      console.log('⚠️ Could not list models from v1beta');
    }

    // Try v1 as well
    try {
      const listUrlV1 = `https://generativelanguage.googleapis.com/v1/models?key=${finalApiKey}`;
      const listResponseV1 = await fetch(listUrlV1);
      if (listResponseV1.ok) {
        const listData = await listResponseV1.json();
        if (listData.models && listData.models.length > 0) {
          const v1Models = listData.models
            .map((m: any) => m.name?.replace('models/', '') || '')
            .filter((name: string) => name && name.includes('gemini'));
          availableModels = [...new Set([...availableModels, ...v1Models])];
          console.log('✅ Available models (v1):', v1Models);
        }
      }
    } catch (e) {
      console.log('⚠️ Could not list models from v1');
    }

    // Build attempts list - prioritize models that are available, or use defaults
    const defaultAttempts = [
      { version: 'v1beta', model: 'gemini-pro' },  // Most common and stable
      { version: 'v1', model: 'gemini-1.5-flash' },
      { version: 'v1', model: 'gemini-1.5-pro' },
      { version: 'v1beta', model: 'gemini-1.5-flash' },
      { version: 'v1beta', model: 'gemini-1.5-pro' },
    ];

    // If we found available models, prioritize those
    const attempts = availableModels.length > 0
      ? availableModels
          .map(model => {
            // Determine version - newer models usually work with v1
            const version = model.includes('1.5') ? 'v1' : 'v1beta';
            return { version, model };
          })
          .concat(defaultAttempts)
      : defaultAttempts;

    let lastError: any = null;
    let successfulResponse: Response | null = null;

    for (const attempt of attempts) {
      try {
        // Build URL - standard format
        const url = `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${finalApiKey}`;
        console.log(`Trying Gemini API: ${attempt.version}/models/${attempt.model}`);
        
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: contents,
          }),
        });

        if (response.ok) {
          successfulResponse = response;
          console.log(`✅ Success with ${attempt.version}/models/${attempt.model}`);
          break;
        } else {
          const errorData = await response.json().catch(() => ({}));
          lastError = {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error || {},
            version: attempt.version,
            model: attempt.model,
          };
          const errorMsg = errorData.error?.message || response.statusText;
          console.log(`❌ Failed with ${attempt.version}/models/${attempt.model}:`, errorMsg);
          
          // If it's a 404, continue to next attempt
          // If it's a 403/401, the API key might be invalid
          if (response.status === 403 || response.status === 401) {
            console.error('API key authentication failed. Please check your API key.');
            // Don't continue if auth fails - the key is invalid
            break;
          }
        }
      } catch (error: any) {
        lastError = { error, version: attempt.version, model: attempt.model };
        console.log(`❌ Network error with ${attempt.version}/models/${attempt.model}:`, error.message);
      }
    }

    if (!successfulResponse) {
      const errorMessage = lastError?.error?.message || lastError?.statusText || 'Unknown error';
      console.error('All Gemini API attempts failed. Last error:', lastError);
      
      // Provide helpful error message based on the issue
      if (lastError?.status === 404) {
        throw new Error(
          `Gemini API error: All models returned 404 (Not Found). ` +
          `This usually means:\n` +
          `1. Your API key doesn't have access to Gemini models\n` +
          `2. Gemini API is not enabled for your Google Cloud project\n` +
          `3. The API key is invalid or expired\n\n` +
          `Please:\n` +
          `- Go to https://aistudio.google.com/app/apikey\n` +
          `- Verify your API key is active\n` +
          `- Make sure Gemini API is enabled\n` +
          `- Try creating a new API key if needed`
        );
      }
      
      throw new Error(`Gemini API error: ${errorMessage}. Please verify your API key has access to Gemini models.`);
    }

    const response = successfulResponse;

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    }
    
    // Check for safety ratings or other issues
    if (data.candidates && data.candidates[0] && data.candidates[0].finishReason) {
      if (data.candidates[0].finishReason === 'SAFETY') {
        throw new Error('Content was blocked by safety filters. Please try a different question.');
      }
      if (data.candidates[0].finishReason === 'RECITATION') {
        throw new Error('Content was blocked due to recitation policy. Please try a different question.');
      }
    }
    
    throw new Error('Invalid response from Gemini API. Please check your API key and try again.');

  } catch (error: any) {
    console.error('Gemini API error:', error);
    
    // Provide more helpful error messages
    // IMPORTANT: Users must add their own API keys in API Integration tab - NO .env.local needed
    if (error.message && error.message.includes('API key')) {
      throw new Error('Invalid or missing Gemini API key. Please add your Gemini API key in the API Integration tab (service name: "Gemini" or "Google"). Get your free key at https://aistudio.google.com/app/apikey');
    }
    
    if (error.message && error.message.includes('403')) {
      throw new Error('Gemini API access denied. Please verify your API key has the correct permissions. Check your API key at https://aistudio.google.com/app/apikey');
    }
    
    if (error.message && error.message.includes('404')) {
      throw new Error('Gemini models not found. Your API key may not have access to Gemini models. Please verify your API key at https://aistudio.google.com/app/apikey and ensure Gemini API is enabled.');
    }
    
    if (error.message && error.message.includes('429')) {
      throw new Error('Gemini API rate limit exceeded. Please try again later.');
    }
    
    // Re-throw the original error if it's already a helpful message
    throw error;
  }
};

