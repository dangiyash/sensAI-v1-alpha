import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "API key is missing" }, { status: 500 });
  }

  try {
    const { moduleTitle, submoduleTitle, submoduleDescription } = await request.json();

    if (!moduleTitle || !submoduleTitle || !submoduleDescription) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Create detailed learning content for the submodule "${submoduleTitle}" which is part of the module "${moduleTitle}".
    Submodule Description: ${submoduleDescription}

    Generate comprehensive learning content that includes:
    1. Clear explanations of key concepts
    2. Practical examples and applications
    3. Important points to remember
    4. Common misconceptions to avoid
    5. Practical exercises or thought questions

    Format the content in HTML with appropriate headings, paragraphs, and lists.
    Use <h3> for main points, <p> for explanations, and <ul>/<ol> for lists.
    Include <strong> for important terms and <em> for emphasis.

    Example format:
    <h3>Key Concept 1</h3>
    <p>Explanation of the concept...</p>
    <ul>
      <li>Important point 1</li>
      <li>Important point 2</li>
    </ul>
    <h3>Practical Example</h3>
    <p>Detailed example with explanation...</p>`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No content generated");
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate content",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 