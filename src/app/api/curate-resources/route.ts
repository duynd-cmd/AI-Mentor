import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectMongoDB } from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import CuratedResource from "@/models/curatedResource";
import { ObjectId } from 'mongodb';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

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

interface Resource {
  title: string;
  url: string;
  description: string;
  benefits: string[];
}

// Add caching for Tavily results
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const searchCache = new Map();

// Simplified Tavily search function
async function searchTavily(subject: string): Promise<TavilyResponse> {
  try {
    // Check cache first
    const cacheKey = subject.toLowerCase().trim();
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_DURATION) {
      return cachedResult.data;
    }

    if (!TAVILY_API_KEY) {
      throw new Error("TAVILY_API_KEY is not configured");
    }

    // Simplified search API call
    const searchResponse = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TAVILY_API_KEY}`
      },
      body: JSON.stringify({
        query: `best learning resources for ${subject}`,
        search_depth: "basic", // Changed to basic for faster results
        include_answer: false,
        max_results: 5, // Reduced to 5 results
        include_domains: [
          "coursera.org",
          "edx.org", 
          "udemy.com",
          "khanacademy.org",
          "freecodecamp.org"
        ]
      })
    });

    if (!searchResponse.ok) {
      throw new Error(`Tavily search failed: ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json() as TavilyResponse;
    
    // Cache results
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: searchData
    });

    return searchData;
  } catch (error) {
    console.error("Tavily API error:", error);
    throw error;
  }
}

// Simplified Gemini function
async function curateResourcesWithGemini(searchData: TavilyResponse, subject: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  const relevantContent = searchData.results
    .map(result => ({
      title: result.title,
      url: result.url,
      description: result.content.substring(0, 100) // Reduced content length
    }));

  // Default high-quality resources if search fails
  const defaultResources = [
    {
      title: "freeCodeCamp",
      url: `https://www.freecodecamp.org/news/search/?query=${encodeURIComponent(subject)}`,
      description: "Free coding tutorials and interactive lessons",
      benefits: ["Interactive learning", "Project-based practice"]
    },
    {
      title: "Khan Academy",
      url: `https://www.khanacademy.org/search?search_again=1&page_search_query=${encodeURIComponent(subject)}`,
      description: "Free educational resources and video tutorials",
      benefits: ["Structured learning path", "Video explanations"]
    },
    {
      title: "MIT OpenCourseWare",
      url: `https://ocw.mit.edu/search/?q=${encodeURIComponent(subject)}`,
      description: "Free access to MIT course materials",
      benefits: ["University-level content", "Comprehensive materials"]
    },
    {
      title: "W3Schools",
      url: `https://www.w3schools.com/search/search.php?q=${encodeURIComponent(subject)}`,
      description: "Interactive tutorials and references",
      benefits: ["Interactive examples", "Beginner-friendly"]
    },
    {
      title: "Codecademy",
      url: `https://www.codecademy.com/search?query=${encodeURIComponent(subject)}`,
      description: "Interactive coding lessons and projects",
      benefits: ["Hands-on practice", "Immediate feedback"]
    }
  ];

  const prompt = `Curate 5 best learning resources for ${subject}.
${JSON.stringify(relevantContent)}

Return in JSON format:
{
  "resources": [
    {
      "title": "Resource name",
      "url": "Resource URL",
      "description": "Brief description",
      "benefits": ["Benefit 1", "Benefit 2"]
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const resources = JSON.parse(text.replace(/```json\s*|\s*```/g, '').trim());
    return resources;
  } catch (error) {
    console.error("Error processing Gemini response:", error);
    return { resources: defaultResources };
  }
}

// Function to transform resource data to match schema
function transformResourceData(resources: Resource[]): Array<{
  title: string;
  link: string;
  type: string;
  description: string;
}> {
  return resources.map(resource => ({
    title: resource.title,
    link: resource.url,
    type: determineResourceType(resource.url),
    description: resource.description
  }));
}

// Helper function to determine resource type
function determineResourceType(url: string): string {
  if (url.includes('youtube.com')) return 'video';
  if (url.includes('github.com')) return 'repository';
  if (url.includes('coursera.org') || url.includes('edx.org')) return 'course';
  if (url.includes('medium.com') || url.includes('dev.to')) return 'article';
  return 'website';
}

// GET endpoint to fetch stored resources
export async function GET(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  req: NextRequest
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.log("No session or user ID found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Fetching resources for user:", session.user.id);
    
    await connectMongoDB();
    
    // Convert string ID to ObjectId
    const userId = new ObjectId(session.user.id);
    console.log("Querying with userId:", userId);

    const resources = await CuratedResource.find({
      userId: userId
    }).lean();

    console.log("Raw MongoDB response:", JSON.stringify(resources, null, 2));

    if (!resources || resources.length === 0) {
      console.log("No resources found for user");
      return NextResponse.json({ resources: [] });
    }

    // Transform the MongoDB documents to plain objects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedResources = resources.map((resource: any) => {
      try {
        return {
          _id: resource._id.toString(),
          topic: resource.topic,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          resources: resource.resources.map((item: any) => ({
            _id: item._id.toString(),
            title: item.title,
            description: item.description,
            type: item.type,
            link: item.link
          })),
          lastUpdated: resource.lastUpdated,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt
        };
      } catch (err) {
        console.error("Error transforming resource:", err);
        console.log("Problematic resource:", resource);
        return null;
      }
    }).filter(Boolean); // Remove any null values from failed transformations

    console.log("Successfully transformed resources:", 
      JSON.stringify(transformedResources, null, 2)
    );

    return NextResponse.json({ resources: transformedResources });
  } catch (error) {
    console.error("Error fetching resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject } = await req.json();
    if (!subject?.trim()) {
      return NextResponse.json(
        { error: "Subject is required" },
        { status: 400 }
      );
    }

    const searchData = await searchTavily(subject);
    const curatedResources = await curateResourcesWithGemini(searchData, subject);
    const transformedResources = transformResourceData(curatedResources.resources);

    await connectMongoDB();
    const newResources = new CuratedResource({
      userId: session.user.id,
      topic: subject,
      resources: transformedResources,
      lastUpdated: new Date()
    });

    await newResources.save();
    return NextResponse.json({ resources: transformedResources });

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to curate resources. Please try again later." },
      { status: 500 }
    );
  }
}