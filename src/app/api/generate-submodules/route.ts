import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { moduleTitle, moduleDescription } = await request.json();

    if (!moduleTitle || !moduleDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create detailed submodules for the module "${moduleTitle}".
    Module Description: ${moduleDescription}

    Generate 5-8 submodules that break down this module into specific learning components. Each submodule should have:
    1. A specific, focused title
    2. A detailed description of what will be covered
    3. A clear connection to the main module's objectives

    Format the response as a JSON array of objects with "title" and "description" fields.
    Example format:
    [
      {
        "title": "Specific Aspect of [Module]",
        "description": "Detailed explanation of this specific aspect..."
      },
      ...
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean and parse the response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
    const submodules = JSON.parse(cleanedText);

    return NextResponse.json({ submodules });
  } catch (error) {
    console.error("Error generating submodules:", error);
    return NextResponse.json(
      { error: "Failed to generate submodules" },
      { status: 500 }
    );
  }
} 