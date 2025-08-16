import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Patent } from "@shared/schema";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface PriorArtResult {
  patentId: string;
  title: string;
  description: string;
  similarityScore: number;
  source: string;
}

interface PatentValuation {
  estimatedValue: number;
  confidence: number;
  factors: string[];
  marketAnalysis: string;
  recommendations: string[];
}

interface SimilarityResult {
  similarityScore: number;
  confidence: number;
  analysis: string;
  riskLevel: 'low' | 'medium' | 'high';
}

interface PatentDraft {
  title: string;
  abstract: string;
  background: string;
  summary: string;
  detailedDescription: string;
  claims: string[];
  drawings?: string[];
}

class AIService {
  private async generateWithGemini(prompt: string, systemPrompt: string): Promise<string> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY not configured. Please add it to your .env file.");
      }

      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const fullPrompt = `${systemPrompt}\n\n${prompt}`;
      const result = await model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from Gemini AI");
      }
      
      return text;
    } catch (error) {
      console.error("Gemini AI error:", error);
      
      // Provide more specific error messages for common issues
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('API_KEY_INVALID')) {
        throw new Error("Invalid Gemini API key. Please check your GEMINI_API_KEY in .env file.");
      } else if (errorMessage.includes('QUOTA_EXCEEDED')) {
        throw new Error("Gemini API quota exceeded. Please check your usage limits.");
      } else if (errorMessage.includes('RATE_LIMIT_EXCEEDED')) {
        throw new Error("Gemini API rate limit exceeded. Please try again later.");
      }
      
      throw error;
    }
  }

  private parseAIResponse(response: string, fallback: any = {}): any {
    try {
      // Clean up response - remove markdown code blocks and extra whitespace
      let cleanResponse = response
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .replace(/^\s*[\r\n]/gm, '')
        .trim();
      
      // Remove any leading/trailing text that's not JSON
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Raw response preview:", response.substring(0, 300));
      
      // Try multiple JSON extraction patterns
      const patterns = [
        /\{[\s\S]*?\}/,
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,
        /\{.*\}/s
      ];
      
      for (const pattern of patterns) {
        const jsonMatch = response.match(pattern);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (secondParseError) {
            continue;
          }
        }
      }
      
      console.error("All JSON parsing attempts failed, using fallback");
      return fallback;
    }
  }

  async performPriorArtSearch(description: string): Promise<PriorArtResult[]> {
    try {
      const systemPrompt = "You are a patent research expert. Analyze patent descriptions and identify prior art with high accuracy. Respond with valid JSON only.";
      
      const prompt = `
        Analyze the following patent description and identify potential prior art. 
        Return a JSON array of similar patents with the following structure:
        {
          "results": [
            {
              "patentId": "US-XXXX-XXXX",
              "title": "Patent Title",
              "description": "Brief description",
              "similarityScore": 0.85,
              "source": "USPTO"
            }
          ]
        }
        
        Patent description: ${description}
        
        Focus on technical similarities, innovative aspects, and potential conflicts.
      `;

      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, { results: [] });
      return result.results || [];
    } catch (error) {
      console.error("Error in prior art search:", error);
      return [];
    }
  }

  async evaluatePatentValue(patent: Patent): Promise<PatentValuation> {
    try {
      const systemPrompt = "You are a patent valuation expert. Provide realistic commercial valuations based on market data and innovation potential. Respond with valid JSON only.";
      
      const prompt = `
        Evaluate the commercial value of this patent based on market potential, innovation level, and industry trends.
        Return a JSON object with the following structure:
        {
          "estimatedValue": 450000,
          "confidence": 0.78,
          "factors": ["Market size", "Innovation level", "Commercial applicability"],
          "marketAnalysis": "Detailed market analysis",
          "recommendations": ["Licensing opportunities", "Market expansion"]
        }
        
        Patent Details:
        Title: ${patent.title}
        Description: ${patent.description}
        Category: ${patent.category}
        Status: ${patent.status}
      `;

      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        estimatedValue: 0,
        confidence: 0,
        factors: [],
        marketAnalysis: "Valuation analysis unavailable",
        recommendations: []
      });
      return {
        estimatedValue: result.estimatedValue || 0,
        confidence: result.confidence || 0,
        factors: result.factors || [],
        marketAnalysis: result.marketAnalysis || "",
        recommendations: result.recommendations || [],
      };
    } catch (error) {
      console.error("Error in patent valuation:", error);
      return {
        estimatedValue: 0,
        confidence: 0,
        factors: [],
        marketAnalysis: "Valuation analysis unavailable",
        recommendations: [],
      };
    }
  }

  async detectSimilarity(sourceText: string, targetText: string): Promise<SimilarityResult> {
    try {
      const systemPrompt = "You are a patent similarity expert. Analyze text similarity for potential patent conflicts. Respond with valid JSON only.";
      
      const prompt = `
        Compare these two patent descriptions for similarity and potential conflicts.
        Return a JSON object with the following structure:
        {
          "similarityScore": 0.75,
          "confidence": 0.85,
          "analysis": "Detailed similarity analysis",
          "riskLevel": "medium"
        }
        
        Source Text: ${sourceText}
        Target Text: ${targetText}
        
        Focus on technical concepts, methodology, and potential infringement risks.
      `;

      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        similarityScore: 0,
        confidence: 0,
        analysis: "Similarity analysis unavailable",
        riskLevel: 'low'
      });
      return {
        similarityScore: result.similarityScore || 0,
        confidence: result.confidence || 0,
        analysis: result.analysis || "",
        riskLevel: result.riskLevel || 'low',
      };
    } catch (error) {
      console.error("Error in similarity detection:", error);
      return {
        similarityScore: 0,
        confidence: 0,
        analysis: "Similarity analysis unavailable",
        riskLevel: 'low',
      };
    }
  }

  async generatePatentDraft(input: {
    title: string;
    description: string;
    category: string;
  }): Promise<PatentDraft> {
    try {
      const systemPrompt = "You are a patent attorney expert. Generate professional patent application documents with proper legal and technical language. Respond with valid JSON only.";
      
      const prompt = `
        Generate a professional patent application draft based on the following information.
        Return a JSON object with the following structure:
        {
          "title": "Improved title",
          "abstract": "Patent abstract",
          "background": "Background section",
          "summary": "Summary section",
          "detailedDescription": "Detailed description",
          "claims": ["Claim 1", "Claim 2", "Claim 3"]
        }
        
        Input Information:
        Title: ${input.title}
        Description: ${input.description}
        Category: ${input.category}
        
        Generate professional, technical language suitable for patent applications.
        Include multiple detailed claims with proper patent terminology.
      `;

      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        title: input.title,
        abstract: "Patent draft generation unavailable",
        background: "",
        summary: "",
        detailedDescription: "",
        claims: []
      });
      return {
        title: result.title || input.title,
        abstract: result.abstract || "",
        background: result.background || "",
        summary: result.summary || "",
        detailedDescription: result.detailedDescription || "",
        claims: result.claims || [],
        drawings: result.drawings || [],
      };
    } catch (error) {
      console.error("Error in patent drafting:", error);
      return {
        title: input.title,
        abstract: "Patent draft generation unavailable",
        background: "",
        summary: "",
        detailedDescription: "",
        claims: [],
      };
    }
  }

  async classifyInnovation(description: string): Promise<{
    category: string;
    confidence: number;
    subcategories: string[];
    analysis: string;
  }> {
    try {
      const systemPrompt = "You are an innovation classification expert. Categorize innovations accurately based on technical content. Respond with valid JSON only.";
      
      const prompt = `
        Classify this innovation into appropriate patent categories.
        Return a JSON object with the following structure:
        {
          "category": "medical_technology",
          "confidence": 0.92,
          "subcategories": ["diagnostic devices", "medical imaging"],
          "analysis": "Detailed classification analysis"
        }
        
        Innovation Description: ${description}
        
        Use these main categories: medical_technology, software_ai, renewable_energy, manufacturing, biotechnology, automotive, telecommunications, other
      `;

      const response = await this.generateWithGemini(prompt, systemPrompt);
      const result = this.parseAIResponse(response, {
        category: 'other',
        confidence: 0,
        subcategories: [],
        analysis: "Classification analysis unavailable"
      });
      return {
        category: result.category || 'other',
        confidence: result.confidence || 0,
        subcategories: result.subcategories || [],
        analysis: result.analysis || "",
      };
    } catch (error) {
      console.error("Error in innovation classification:", error);
      return {
        category: 'other',
        confidence: 0,
        subcategories: [],
        analysis: "Classification analysis unavailable",
      };
    }
  }
}

export const aiService = new AIService();
