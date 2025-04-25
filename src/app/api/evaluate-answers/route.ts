import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

export async function POST(request: Request) {
  try {
    const { language, answers, customLanguage } = await request.json()
    const isCustom = customLanguage?.isCustom || false
    const topic = isCustom ? customLanguage.name : language
    const description = isCustom ? customLanguage.description : `Learning ${language}`
    const concepts = isCustom ? customLanguage.concepts.join(", ") : ""

    // Calculate skill gaps based on answers
    const skillGaps = answers
      .filter((answer: { isCorrect: boolean }) => !answer.isCorrect)
      .map((answer: { skill: string }) => answer.skill)

    if (skillGaps.length === 0) {
      return NextResponse.json({
        skillGap: {
          title: "No significant skill gaps detected",
          detail: "Your answers show a good understanding of the topic. Consider exploring more advanced concepts."
        },
        learningPath: []
      })
    }

    const skillList = skillGaps.join(", ")

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `Create a detailed learning path for the topic "${topic}". 
    Description: ${description}
    Key Concepts: ${concepts}

    CRITICAL RULES:
    1. ALL resources MUST be directly and exclusively about "${topic}"
    2. DO NOT include any programming or coding examples unless "${topic}" is explicitly about programming/software development
    3. DO NOT include any computer science concepts unless "${topic}" is explicitly about computer science
    4. Each resource must be 100% relevant to its chapter's specific topic
    5. If a chapter is about a specific aspect of "${topic}", only include resources that focus on that exact aspect
    6. For non-programming topics (like chemistry, physics, biology, etc.):
       - Focus on domain-specific examples and applications
       - Use appropriate learning materials (textbooks, research papers, experiments, etc.)
       - Include practical demonstrations and real-world applications
       - Provide relevant diagrams, visualizations, and domain-specific tools
    7. For programming topics only:
       - Include code examples and programming exercises
       - Provide development tools and environments
       - Include debugging and testing resources

    Generate a comprehensive learning path with:
    1. Clear module titles and descriptions that are specific to "${topic}"
    2. Detailed chapter breakdowns that focus on different aspects of "${topic}"
    3. High-quality, free learning resources that are exclusively about "${topic}"
    4. Focus on practical applications and real-world examples specific to "${topic}"
    5. Include both theoretical foundations and practical skills related to "${topic}"

    Format the response as a JSON object with the following structure:
    {
      "modules": [
        {
          "title": "Module Title specific to ${topic}",
          "description": "Module description focusing on ${topic}...",
          "chapters": [
            {
              "title": "Chapter Title about specific aspect of ${topic}",
              "resources": [
                {
                  "title": "Resource Title that is exclusively about this aspect of ${topic}",
                  "url": "https://example.com",
                  "type": "article|video|documentation|experiment|textbook|research_paper"
                }
              ]
            }
          ]
        }
      ]
    }

    Important rules for resource selection:
    1. Only include free, high-quality resources from reputable sources
    2. Every resource MUST be 100% about "${topic}" or its specific aspects
    3. Include a mix of resource types appropriate for "${topic}":
       - For science topics: articles, experiments, research papers, textbooks
       - For humanities: articles, books, documentaries, primary sources
       - For programming only: documentation, tutorials, code examples
    4. Focus on practical, hands-on learning materials specific to the domain
    5. Ensure all URLs are valid and accessible
    6. DO NOT include any resources that are about other topics
    7. Each resource must be directly relevant to its chapter's specific aspect of "${topic}"
    8. For non-programming topics, DO NOT include any programming-related content

    Return ONLY the JSON object, no other text or markdown.`;

    const result = await model.generateContent(prompt)
    const text = (await result.response).text().trim()

    // Extract only the JSON portion (between first `{` and last `}`)
    const jsonMatch = text.match(/{[\s\S]*}/)
    if (!jsonMatch) {
      throw new Error("No JSON object found in Gemini response.")
    }

    const jsonText = jsonMatch[0]

    // Parse and validate structure
    const parsed = JSON.parse(jsonText)

    if (
      !parsed.skillGap ||
      typeof parsed.skillGap !== "object" ||
      !Array.isArray(parsed.learningPath)
    ) {
      throw new Error("Missing skillGap or learningPath in response.")
    }

    for (const [i, item] of parsed.learningPath.entries()) {
      if (!item.title || !item.description || !Array.isArray(item.resources)) {
        throw new Error(`Invalid learningPath item at index ${i}`)
      }
      for (const [j, res] of item.resources.entries()) {
        if (!res.title || !res.url || !res.type) {
          throw new Error(`Invalid resource at learningPath[${i}].resources[${j}]`)
        }
      }
    }

    return NextResponse.json({
      ...parsed,
      assessmentData: {
        language,
        skillGaps,
        timestamp: new Date().toISOString(),
        isCustom
      }
    })
  } catch (error: any) {
    console.error("API Error:", error)
    return NextResponse.json(
      {
        error: "Failed to generate learning content",
        message: error.message || "Unknown error"
      },
      { status: 500 }
    )
  }
}
