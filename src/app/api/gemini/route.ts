import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a detailed learning pathway for ${topic} with the following structure:
    - Break it down into steps (maximum 5 steps)
    - Each step should have multiple topics
    - For each topic include:
      - Title
      - Difficulty (Easy/Medium/Hard)
      - Resource links (article, video, practice)
      - Whether it requires revision
    Format the response as a JSON object following this structure:
    {
      "steps": [
        {
          "id": "step-1",
          "title": "Step Title",
          "topics": [
            {
              "id": "topic-1",
              "title": "Topic Title",
              "completed": false,
              "articleLink": "url",
              "youtubeLink": "url",
              "practiceLink": "url",
              "difficulty": "Easy/Medium/Hard",
              "starred": false
            }
          ]
        }
      ]
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid response format");
    }
    
    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to generate learning pathway" },
      { status: 500 }
    );
  }
} 