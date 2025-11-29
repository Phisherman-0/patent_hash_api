import { Request, Response } from 'express';
import { storage } from '../storage';
import { aiService } from '../services/aiService';

export const aiController = {
  // Perform prior art search
  priorArtSearch: async (req: any, res: Response) => {
    try {
      const { patentId, description } = req.body;
      const userId = req.user.id;

      // Verify patent ownership
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Perform AI prior art search
      const searchResults = await aiService.performPriorArtSearch(description);

      // Store results in database
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

      // Create AI analysis record
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

  // Perform patent valuation
  patentValuation: async (req: any, res: Response) => {
    try {
      const { patentId } = req.body;
      const userId = req.user.id;

      // Verify patent ownership
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Perform AI valuation
      const valuation = await aiService.evaluatePatentValue(patent);

      // Update patent with estimated value
      await storage.updatePatent(patentId, {
        estimatedValue: valuation.estimatedValue.toString(),
      });

      // Create AI analysis record
      await storage.createAIAnalysis({
        patentId,
        analysisType: 'valuation',
        result: valuation,
        confidence: valuation.confidence.toString(),
      });

      // Create activity record
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

  // Perform similarity detection
  similarityDetection: async (req: any, res: Response) => {
    try {
      const { patentId, targetText } = req.body;
      const userId = req.user.id;

      // Verify patent ownership
      const patent = await storage.getPatent(patentId);
      if (!patent || patent.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Perform similarity detection
      const similarity = await aiService.detectSimilarity(patent.description, targetText);

      // Create AI analysis record
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

  // Generate patent draft
  patentDrafting: async (req: any, res: Response) => {
    try {
      const { title, description, category } = req.body;
      
      // Generate patent document using AI
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