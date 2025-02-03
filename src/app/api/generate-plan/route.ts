import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import StudyPlan from "@/models/studyPlan";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

interface TavilyResponse {
  results: TavilySearchResult[];
  answer?: string;
}

// Simplified search function
async function searchTavily(subject: string): Promise<TavilyResponse> {
  try {
    if (!process.env.TAVILY_API_KEY) {
      return { results: [], answer: '' };
    }

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: `${subject} study guide`,
        search_depth: "basic",
        include_answer: true,
        max_results: 5
      })
    });

    if (!response.ok) {
      return { results: [], answer: '' };
    }

    const data = await response.json();
    return {
      results: data.results || [],
      answer: data.answer || ''
    };
  } catch (error) {
    console.error("Tavily search error:", error);
    return { results: [], answer: '' };
  }
}

// Simplified plan generation
async function generatePlanWithGemini(
  searchData: TavilyResponse, 
  subject: string, 
  daysUntilExam: number, 
  examDate: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const prompt = `Create a ${daysUntilExam}-day study plan for ${subject}.
Exam date: ${examDate}

${searchData.answer ? `Context: ${searchData.answer}\n` : ''}

Return in JSON format:
{
  "overview": {
    "subject": "${subject}",
    "duration": "${daysUntilExam} days",
    "examDate": "${examDate}"
  },
  "weeklyPlans": [
    {
      "week": "Week X",
      "goals": ["Goal 1", "Goal 2"],
      "dailyTasks": [
        {
          "day": "Day Y",
          "tasks": ["Task 1", "Task 2"],
          "duration": "X hours"
        }
      ]
    }
  ],
  "recommendations": ["Tip 1", "Tip 2"]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text().replace(/```json\s*|\s*```/g, '').trim());
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, examDate } = await req.json();
    if (!subject?.trim() || !examDate) {
      return NextResponse.json(
        { error: "Subject and exam date are required" },
        { status: 400 }
      );
    }

    // 3. Calculate days until exam
    const currentDate = new Date().toISOString().split('T')[0];
    const daysUntilExam = Math.ceil(
      (new Date(examDate).getTime() - new Date(currentDate).getTime()) / (1000 * 3600 * 24)
    );

    if (daysUntilExam < 0) {
      return NextResponse.json(
        { error: "Exam date must be in the future" },
        { status: 400 }
      );
    }

    if (daysUntilExam > 365) {
      return NextResponse.json(
        { error: "Exam date must be within one year" },
        { status: 400 }
      );
    }

    // 4. Get curriculum information
    const searchData = await searchTavily(subject);

    // 5. Generate plan using the gathered information
    const plan = await generatePlanWithGemini(
      searchData,
      subject,
      daysUntilExam,
      examDate
    );

    // 6. Save to database
    await connectMongoDB();
    const newPlan = new StudyPlan({
      userId: session.user.id,
      overview: plan.overview,
      weeklyPlans: plan.weeklyPlans,
      recommendations: plan.recommendations,
      isActive: true,
      progress: 0,
      lastUpdated: new Date()
    });

    await newPlan.save();
    return NextResponse.json({ plan: newPlan });
  } catch (error) {
    console.error("Error generating plan:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}