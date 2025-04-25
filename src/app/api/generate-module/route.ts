import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { topic, currentModuleTitle } = await req.json();

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a detailed learning module about "${topic}". The module should be structured as a JSON object with the following format:
    {
      "title": "A concise and descriptive title for the module",
      "description": "A brief overview of what the module covers",
      "chapters": [
        {
          "title": "Chapter title",
          "description": "Chapter description",
          "content": {
            "definition": "Clear definition of the concept",
            "explanation": "Detailed explanation",
            "keyPoints": ["Key point 1", "Key point 2", ...],
            "applications": [
              {
                "title": "Application title",
                "description": "Application description",
                "example": "Practical example"
              }
            ],
            "challenges": [
              {
                "title": "Challenge title",
                "solution": "Solution description"
              }
            ],
            "resources": [
              {
                "title": "Resource title",
                "description": "Resource description",
                "url": "Resource URL",
                "type": "Resource type (video, article, etc.)"
              }
            ]
          }
        }
      ]
    }

    IMPORTANT: Return ONLY the JSON object. Do not include any markdown formatting, backticks, or additional text.`;

    console.log("Sending prompt to Gemini:", prompt);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Received response from Gemini:", text);

    if (!text) {
      console.error("Empty response from Gemini");
      throw new Error("Empty response from model");
    }

    // Clean the response text
    const cleanedText = text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    try {
      const moduleData = JSON.parse(cleanedText);
      console.log("Successfully parsed module data:", moduleData);
      return NextResponse.json({ module: moduleData });
    } catch (parseError) {
      console.error("Error parsing module data:", parseError);
      console.error("Raw response that failed to parse:", text);
      console.error("Cleaned text that failed to parse:", cleanedText);
      throw new Error(`Invalid module data format: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Error in generate-module API:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate module. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 