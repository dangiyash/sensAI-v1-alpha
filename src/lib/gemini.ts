import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateAssessmentQuestions(language: string) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate 5 ${language} programming questions that test different skill levels from beginner to advanced. 
    Each question should be unique and test different ${language} concepts. 
    Return the questions in JSON format with the following structure:
    {
      "questions": [
        {
          "id": number,
          "question": string,
          "difficulty": "beginner" | "intermediate" | "advanced",
          "concept": string
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error("Invalid response format from Gemini");
      }
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions");
  }
}

export async function evaluateAnswers(answers: { [key: number]: string }, language: string) {
  try {
    if (!answers || typeof answers !== 'object') {
      throw new Error("Invalid answers format");
    }
    if (!language || typeof language !== 'string') {
      throw new Error("Invalid language format");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Format the answers for the prompt
    const formattedAnswers = Object.entries(answers)
      .map(([id, answer]) => `Question ${id}:\n${answer}`)
      .join('\n\n');

    const prompt = `Evaluate these ${language} programming answers and identify skill gaps. 
    Here are the answers to evaluate:
    
    ${formattedAnswers}
    
    Please analyze these answers and provide:
    1. A summary of the skill gaps identified
    2. A personalized learning path to address these gaps
    
    Return a JSON response with the following structure:
    {
      "skillGap": "A detailed description of the identified skill gaps",
      "learningPath": [
        {
          "title": "Topic to learn",
          "description": "Brief description of what to learn",
          "difficulty": "beginner" | "intermediate" | "advanced",
          "concept": "Programming concept covered"
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    try {
      const parsed = JSON.parse(text);
      if (!parsed.skillGap || !parsed.learningPath || !Array.isArray(parsed.learningPath)) {
        throw new Error("Invalid response format from Gemini");
      }
      return parsed;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      throw new Error("Invalid response format from Gemini");
    }
  } catch (error) {
    console.error("Error evaluating answers:", error);
    throw new Error("Failed to evaluate answers");
  }
} 