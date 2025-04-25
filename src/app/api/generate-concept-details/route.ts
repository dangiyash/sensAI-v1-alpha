import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { topic, concept, customLanguage } = await request.json();

    if (!topic || !concept) {
      return NextResponse.json(
        { error: "Topic and concept are required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Generate detailed content about the concept "${concept}" in the context of "${topic}".
    ${customLanguage ? `This is a custom topic about: ${customLanguage.description}` : ""}

    Provide a comprehensive explanation that includes:
    1. Clear definition and explanation specific to the topic
    2. Key principles and fundamentals relevant to the domain
    3. Real-world applications and examples from the actual field
    4. Common challenges and solutions in the context of the topic
    5. Related concepts and connections within the domain
    6. Practical tips and best practices for the specific field

    IMPORTANT RULES:
    1. Content must be specific to the topic, not generic programming
    2. Examples must be relevant to the actual domain
    3. For non-programming topics, focus on domain-specific knowledge
    4. Avoid any programming-specific examples unless the topic is explicitly about programming
    5. Ensure all explanations use terminology appropriate to the field
    6. Include practical applications that are relevant to the actual topic

    Format the response as a JSON object with this structure:
    {
      "title": "Concept Title",
      "definition": "Clear definition of the concept in the context of the topic",
      "explanation": "Detailed explanation of the concept specific to the domain",
      "keyPoints": ["key point 1", "key point 2", "key point 3"],
      "applications": [
        {
          "title": "Application Title",
          "description": "How this concept is applied in the field",
          "example": "Specific example or case study from the domain"
        }
      ],
      "challenges": [
        {
          "title": "Common Challenge",
          "solution": "How to address this challenge in the context of the topic"
        }
      ],
      "resources": [
        {
          "title": "Resource Title",
          "type": "Article|Video|Documentation",
          "url": "URL",
          "description": "Why this resource is helpful for understanding this concept"
        }
      ]
    }

    Return ONLY the JSON object, no other text or markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }

    const conceptDetails = JSON.parse(jsonMatch[0]);
    return NextResponse.json(conceptDetails);
  } catch (error) {
    console.error("Error generating concept details:", error);
    return NextResponse.json(
      { error: "Failed to generate concept details" },
      { status: 500 }
    );
  }
} 