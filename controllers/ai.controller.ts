import { Request, Response } from 'express';
import { storage } from '../storage';
import { aiService } from '../services/aiService';

export const aiController = {
  priorArtSearch: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { patentId, description } = req.body;
      const userId = req.user.id;

      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const searchResults = await aiService.performPriorArtSearch(description);

      for (const result of searchResults) {
        await storage.createPriorArtResult({
          patentId,
          externalPatentId: result.patentId,
          similarityScore: result.similarityScore.toString(),
          title: result.title,
          description: result.description,
          source: result.source,
        });
      }

      await storage.createAIAnalysis({
        patentId,
        analysisType: 'prior_art',
        result: { results: searchResults },
        confidence: Math.max(...searchResults.map(r => r.similarityScore)).toString(),
      });

      res.json(searchResults);
    } catch (error) {
      console.error("Error in prior art search:", error);
      res.status(500).json({ message: "Failed to perform prior art search" });
    }
  },

  patentValuation: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { patentId } = req.body;
      const userId = req.user.id;

      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const valuation = await aiService.evaluatePatentValue(patent);

      await storage.updatePatent(patentId, {
        estimatedValue: valuation.estimatedValue.toString(),
      });

      await storage.createAIAnalysis({
        patentId,
        analysisType: 'valuation',
        result: valuation,
        confidence: valuation.confidence.toString(),
      });

      await storage.createPatentActivity({
        patentId,
        userId,
        activityType: 'valuation_updated',
        description: `Patent valuation updated to $${valuation.estimatedValue}`,
      });

      res.json(valuation);
    } catch (error) {
      console.error("Error in patent valuation:", error);
      res.status(500).json({ message: "Failed to evaluate patent value" });
    }
  },

  similarityDetection: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { patentId, targetText } = req.body;
      const userId = req.user.id;

      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const similarity = await aiService.detectSimilarity(patent.description, targetText);

      await storage.createAIAnalysis({
        patentId,
        analysisType: 'similarity',
        result: similarity,
        confidence: similarity.confidence.toString(),
      });

      res.json(similarity);
    } catch (error) {
      console.error("Error in similarity detection:", error);
      res.status(500).json({ message: "Failed to detect similarity" });
    }
  },

  patentDrafting: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { title, description, category } = req.body;
      
      const draftDocument = await aiService.generatePatentDraft({
        title,
        description,
        category,
      });

      res.json(draftDocument);
    } catch (error) {
      console.error("Error in patent drafting:", error);
      res.status(500).json({ message: "Failed to generate patent draft" });
    }
  }
};
