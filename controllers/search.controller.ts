import { Request, Response } from 'express';
import { storage } from '../storage';

export const searchController = {
  searchPatents: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const query = req.query.q as string;
      
      if (!query) return res.status(400).json({ message: "Search query required" });

      const results = await storage.searchPatents(query, req.user.id);
      res.json(results);
    } catch (error) {
      console.error("Error searching patents:", error);
      res.status(500).json({ message: "Failed to search patents" });
    }
  }
};
