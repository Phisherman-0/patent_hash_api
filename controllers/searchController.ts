import { Request, Response } from 'express';
import { storage } from '../storage';

export const searchController = {
  // Search patents
  searchPatents: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }

      const results = await storage.searchPatents(query, userId);
      res.json(results);
    } catch (error) {
      console.error("Error searching patents:", error);
      res.status(500).json({ message: "Failed to search patents" });
    }
  }
};