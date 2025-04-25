import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Check for API key at initialization
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in environment variables");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    // Check if API key is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is missing");
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    const { topic, description, concepts } = await request.json();

    if (!topic || !description || !concepts) {
      console.error("Missing required fields:", { topic, description, concepts });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a structured learning path for the topic "${topic}". 
    Description: ${description}
    Key Concepts: ${concepts}

    Generate 4-6 main modules that cover the essential aspects of this topic. Each module should have:
    1. A clear, descriptive title
    2. A brief description of what will be covered
    3. A logical progression from basic to advanced concepts
    4. Focus on practical applications and real-world examples
    5. Include both theoretical foundations and practical skills

    Format the response as a JSON array of objects with "title" and "description" fields.
    Example format:
    [
      {
        "title": "Introduction to [Topic]",
        "description": "Overview of basic concepts and fundamentals..."
      },
      ...
    ]

    Return ONLY the JSON array, no other text or markdown.`;

    console.log("Sending request to Gemini API with prompt:", prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      console.error("No response text received from Gemini API");
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 500 }
      );
    }

    console.log("Received response from Gemini API:", text);

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("No JSON array found in response");
      return NextResponse.json(
        { error: "Invalid response format - no JSON array found" },
        { status: 500 }
      );
    }

    let modules;
    try {
      modules = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse JSON response:", parseError);
      console.error("Raw response:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    if (!Array.isArray(modules)) {
      console.error("Parsed response is not an array:", modules);
      return NextResponse.json(
        { error: "Invalid response format - not an array" },
        { status: 500 }
      );
    }

    // Validate each module has required fields
    for (const [index, module] of modules.entries()) {
      if (!module.title || !module.description) {
        console.error(`Module at index ${index} missing required fields:`, module);
        return NextResponse.json(
          { error: `Invalid module format at index ${index}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ modules });
  } catch (error) {
    console.error("Error in generate-modules endpoint:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate modules",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 