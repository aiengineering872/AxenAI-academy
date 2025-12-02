import { generateGeminiResponse } from './gemini';

export interface ProjectReviewCriteria {
  innovation: number;
  accuracy: number;
  presentation: number;
  overallScore: number;
  feedback: string;
}

export const reviewProject = async (
  title: string,
  description: string,
  codeSnippet?: string,
  apiKey?: string
): Promise<ProjectReviewCriteria> => {
  const prompt = `Review this AI/ML project and provide ratings (1-10) for:
1. Innovation - How creative and novel is the approach?
2. Accuracy - How correct and well-implemented is the solution?
3. Presentation - How clear and well-documented is it?

Project Title: ${title}
Description: ${description}
${codeSnippet ? `Code: ${codeSnippet}` : ''}

Provide a JSON response with:
{
  "innovation": <number 1-10>,
  "accuracy": <number 1-10>,
  "presentation": <number 1-10>,
  "overallScore": <average of three scores>,
  "feedback": "<detailed feedback string>"
}`;

  try {
    // Use provided API key or return default review if no key
    if (!apiKey) {
      console.warn('No API key provided for project review. Returning default review.');
      return {
        innovation: 7,
        accuracy: 7,
        presentation: 7,
        overallScore: 7,
        feedback: 'Good project with solid implementation. Add your Gemini API key in API Integration tab for AI-powered reviews.',
      };
    }
    
    const response = await generateGeminiResponse(prompt, undefined, undefined, apiKey);
    
    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        innovation: Math.min(10, Math.max(1, parsed.innovation || 7)),
        accuracy: Math.min(10, Math.max(1, parsed.accuracy || 7)),
        presentation: Math.min(10, Math.max(1, parsed.presentation || 7)),
        overallScore: Math.round((parsed.innovation + parsed.accuracy + parsed.presentation) / 3),
        feedback: parsed.feedback || 'Good project with solid implementation.',
      };
    }

    // Fallback if JSON parsing fails
    return {
      innovation: 7,
      accuracy: 7,
      presentation: 7,
      overallScore: 7,
      feedback: response || 'Good project with solid implementation. Consider adding more documentation.',
    };
  } catch (error) {
    console.error('Error reviewing project:', error);
    // Default review
    return {
      innovation: 7,
      accuracy: 7,
      presentation: 7,
      overallScore: 7,
      feedback: 'Good project with solid implementation. Consider adding more documentation and code comments.',
    };
  }
};

