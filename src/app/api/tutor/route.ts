import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { language, moduleTitle, moduleDescription, chapter, customLanguage, assessmentData } = await request.json();

    if (!language) {
      return NextResponse.json(
        { error: "Language is required" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let prompt;
    if (chapter) {
      // Generate content for a specific chapter
      prompt = `Create detailed content for the chapter "${chapter}" in ${language}.
${customLanguage ? `This is a custom topic about: ${customLanguage.description}` : ""}
${assessmentData ? `The student has shown gaps in: ${assessmentData.skillGaps.join(", ")}` : ""}

Generate comprehensive content that:
1. Explains the concept in detail
2. Provides practical examples and applications
3. Includes key principles and fundamentals
4. Offers exercises and challenges
5. Lists relevant resources

IMPORTANT RULES:
1. Content must be specific to the chapter topic
2. No generic programming examples unless explicitly about programming
3. Focus on domain-specific knowledge and applications
4. Ensure all examples are relevant to the actual topic
5. Provide clear, step-by-step explanations

Format the response as a JSON object with this structure:
{
  "content": {
    "definition": "Clear definition of the concept",
    "explanation": "Detailed explanation of the concept",
    "keyPoints": ["point1", "point2"],
    "applications": [
      {
        "title": "Application Title",
        "description": "How this is used in practice",
        "example": "Detailed example"
      }
    ],
    "challenges": [
      {
        "title": "Challenge Title",
        "solution": "Detailed solution"
      }
    ],
    "resources": [
      {
        "title": "Resource Name",
        "type": "Article|Video|Documentation",
        "url": "URL",
        "description": "Why this resource is helpful"
      }
    ]
  }
}`;
    } else if (moduleTitle && moduleDescription) {
      // Generate chapters for a specific module
      prompt = `Create a detailed learning path for the module "${moduleTitle}" in ${language}.
      
Module Description: ${moduleDescription}
${customLanguage ? `This is a custom topic about: ${customLanguage.description}` : ""}
${assessmentData ? `The student has shown gaps in: ${assessmentData.skillGaps.join(", ")}` : ""}

Generate 6-9 detailed chapters that dive deep into this specific module. Each chapter should:
1. Have a clear, descriptive title that is unique and not repeated
2. Include a detailed description of what will be covered
3. Focus on practical applications and examples specific to the topic
4. Build upon previous chapters in a logical progression
5. Cover distinct aspects of the topic without overlap

IMPORTANT RULES:
1. Each chapter must cover a unique aspect of the topic
2. No two chapters should have similar or overlapping content
3. Content must be specific to the topic, not generic programming concepts
4. Examples and applications must be relevant to the actual topic
5. For non-programming topics, focus on domain-specific knowledge and applications
6. Avoid any programming-specific examples unless the topic is explicitly about programming

Format the response as a JSON object with this structure:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "description": "Detailed explanation of what this chapter covers",
      "keyPrinciples": ["principle1", "principle2"],
      "applications": [
        {
          "title": "Application Title",
          "description": "How this is used in practice",
          "example": "Detailed example specific to the topic"
        }
      ],
      "exercises": [
        {
          "title": "Exercise Title",
          "description": "What to do",
          "difficulty": "Beginner|Intermediate|Advanced"
        }
      ],
      "resources": [
        {
          "title": "Resource Name",
          "type": "Article|Video|Documentation",
          "url": "URL",
          "description": "Why this resource is helpful"
        }
      ]
    }
  ]
}`;
    } else if (customLanguage && language.toLowerCase() === customLanguage.name.toLowerCase()) {
      // Custom domain prompt
      const concepts = customLanguage.concepts;
      prompt = `Create a comprehensive learning module for ${language} (${customLanguage.description}).

Focus on these key concepts: ${concepts.join(", ")}.
${assessmentData ? `The student has shown gaps in: ${assessmentData.skillGaps.join(", ")}` : ""}

IMPORTANT RULES:
1. Each concept must be covered in a unique and non-overlapping way
2. Content must be specific to the custom topic, not generic programming
3. Examples and applications must be relevant to the actual domain
4. For non-programming topics, focus on domain-specific knowledge
5. Avoid any programming-specific examples unless explicitly requested
6. Ensure each chapter builds upon previous knowledge without repetition

Format the response as a JSON object with this structure:
{
  "chapters": [
    {
      "title": "Chapter Title",
      "description": "Detailed explanation of what this chapter covers",
      "keyPrinciples": ["principle1", "principle2"],
      "applications": [
        {
          "title": "Application Title",
          "description": "How this is used in practice",
          "example": "Detailed example specific to the domain"
        }
      ],
      "exercises": [
        {
          "title": "Exercise Title",
          "description": "What to do",
          "difficulty": "Beginner|Intermediate|Advanced"
        }
      ],
      "resources": [
        {
          "title": "Resource Name",
          "type": "Article|Video|Documentation",
          "url": "URL",
          "description": "Why this resource is helpful"
        }
      ]
    }
  ]
}`;
    } else {
      prompt = `Create a comprehensive learning module for ${language}.`;
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in response");
    }

    const content = JSON.parse(jsonMatch[0]);
    return NextResponse.json(content);
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
} 