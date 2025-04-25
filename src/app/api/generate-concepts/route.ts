import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { name, description } = await request.json();

    if (!name || !description) {
      return NextResponse.json(
        { error: "Name and description are required" },
        { status: 400 }
      );
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Given the following language/framework and its description, generate a list of key concepts that someone should learn. 
    Return the concepts as a comma-separated list. Be concise and focus on the most important concepts.
    Each concept should be 1-3 words maximum.

    Language/Framework: ${name}
    Description: ${description}

    Return only the comma-separated list of concepts, nothing else.`;

    console.log("Sending request to Gemini API with prompt:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("Received response from Gemini API:", text);

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    // Clean up the response and split into array
    const concepts = text
      .split(",")
      .map((concept) => concept.trim())
      .filter(Boolean);

    if (concepts.length === 0) {
      throw new Error("No concepts generated");
    }

    console.log("Generated concepts:", concepts);

    return NextResponse.json({ concepts });
  } catch (error) {
    console.error("Error generating concepts:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate concepts",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 