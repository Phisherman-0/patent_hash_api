import type { Patent } from "@shared/schema";
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
declare class AIService {
    private generateWithGemini;
    private parseAIResponse;
    performPriorArtSearch(description: string): Promise<PriorArtResult[]>;
    evaluatePatentValue(patent: Patent): Promise<PatentValuation>;
    detectSimilarity(sourceText: string, targetText: string): Promise<SimilarityResult>;
    generatePatentDraft(input: {
        title: string;
        description: string;
        category: string;
    }): Promise<PatentDraft>;
    classifyInnovation(description: string): Promise<{
        category: string;
        confidence: number;
        subcategories: string[];
        analysis: string;
    }>;
}
export declare const aiService: AIService;
export {};
//# sourceMappingURL=aiService.d.ts.map