import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language");

  // TODO: In a real application, you would:
  // 1. Get the user's ID from the session
  // 2. Query your database for their latest assessment results
  // 3. Return the actual skill gaps based on their performance

  // For now, we'll return mock data
  const mockResults = {
    python: {
      overallScore: 75,
      skillGaps: ["Decorators", "Generators", "Exception Handling"],
      strengths: ["List Comprehensions", "Basic OOP"],
      lastAssessmentDate: new Date().toISOString(),
    },
    cpp: {
      overallScore: 68,
      skillGaps: ["Templates", "STL", "Memory Management"],
      strengths: ["Basic Syntax", "Pointers"],
      lastAssessmentDate: new Date().toISOString(),
    },
    c: {
      overallScore: 70,
      skillGaps: ["Pointers", "Dynamic Memory Allocation", "File I/O"],
      strengths: ["Basic Syntax", "Structures"],
      lastAssessmentDate: new Date().toISOString(),
    }
  };

  if (!language || !mockResults[language as keyof typeof mockResults]) {
    return NextResponse.json(
      { error: "Invalid language specified" },
      { status: 400 }
    );
  }

  return NextResponse.json(mockResults[language as keyof typeof mockResults]);
} 