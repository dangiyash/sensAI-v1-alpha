import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language");

  if (!language) {
    return NextResponse.json(
      { error: "Language parameter is required" },
      { status: 400 }
    );
  }

  // Get custom language data if it exists
  let customLanguage;
  try {
    if (typeof localStorage !== 'undefined') {
      const customData = localStorage.getItem("customLanguage");
      if (customData) {
        customLanguage = JSON.parse(customData);
      }
    }
  } catch (error) {
    console.error("Error reading custom language:", error);
  }

  // If this is a custom language and we have data for it
  if (customLanguage && language.toLowerCase() === customLanguage.name.toLowerCase()) {
    const concepts = customLanguage.concepts;
    
    // Generate questions based on the custom concepts
    const questions = concepts.map((concept: string, index: number) => ({
      id: `custom-${index + 1}`,
      question: `How familiar are you with ${concept}?`,
      options: [
        "No knowledge",
        "Basic understanding",
        "Intermediate knowledge",
        "Advanced understanding",
        "Expert level"
      ],
      concept: concept,
      difficulty: "custom"
    }));

    return NextResponse.json({ questions });
  }

  // Default questions for built-in languages
  
  const questions = {
  javascript: [
    {
      id: "js-1",
      question: "What is a closure in JavaScript?",
      options: [
        "A function having access to its parent scope",
        "A function that runs immediately",
        "An object method",
        "None of the above"
      ],
      concept: "Closure",
      difficulty: "Intermediate"
    },
    {
      id: "js-2",
      question: "What is the difference between '==' and '==='?",
      options: [
        "'==' checks value and type, '===' checks only value",
        "'===' checks value and type, '==' checks only value",
        "No difference",
        "None of the above"
      ],
      concept: "Comparison Operators",
      difficulty: "Basic"
    }
  ],
  python: [
    {
      id: "py-1",
      question: "What is a Python list comprehension?",
      options: [
        "A way to create lists using a for loop in one line",
        "A syntax error",
        "A special type of function",
        "None of the above"
      ],
      concept: "List Comprehensions",
      difficulty: "Intermediate"
    }
  ]
  // You can add more languages and questions here
};

  const languageQuestions = questions[language.toLowerCase() as keyof typeof questions];

  if (!languageQuestions) {
    return NextResponse.json(
      { error: "Invalid language specified" },
      { status: 400 }
    );
  }

  return NextResponse.json({ questions: languageQuestions });
} 
