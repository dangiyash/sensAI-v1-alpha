import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Question {
  id: number;
  question: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  concept: string;
}

export async function POST(req: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "API key is missing" }, { status: 500 });
  }

  try {
    const { language, answers } = await req.json();
    
    if (!language) {
      return NextResponse.json(
        { error: "Missing required field: language" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Make answers optional
    const prompt = answers && Array.isArray(answers) && answers.length > 0
      ? `Generate 5 ${language} programming questions based on these previous answers: ${JSON.stringify(answers)}. Each question should:
        1. Be clear and concise
        2. Test a specific programming concept
        3. Be suitable for a programming assessment
        4. Not include any answers or explanations
        5. Build upon the concepts shown in the previous answers`
      : `Generate 5 ${language} programming questions. Each question should:
        1. Be clear and concise
        2. Test a specific programming concept
        3. Be suitable for a programming assessment
        4. Not include any answers or explanations
        5. Cover fundamental programming concepts
        
        Format each question as a numbered list (1., 2., etc.)`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("No questions generated from the API response");
    }

    // Extract questions and format them
    const questions: Question[] = text
      .split("\n")
      .map((q: string) => q.trim())
      .filter((q: string) => q.match(/^(\d+\..*)|(^Question \d+:.*)/))
      .map((q: string, index: number) => ({
        id: index + 1,
        question: q.replace(/^(\d+\.\s*)|(^Question \d+:\s*)/, ""),
        difficulty: index < 2 ? "beginner" : index < 4 ? "intermediate" : "advanced",
        concept: "General Programming"
      }));

    if (questions.length === 0) {
      throw new Error("No valid questions found in the response");
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate questions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 