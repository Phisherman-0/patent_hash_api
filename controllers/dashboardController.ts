import { Request, Response } from 'express';
import { storage } from '../storage';

export const dashboardController = {
  // Get dashboard statistics
  getStats: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  },

  // Get user activities
  getActivities: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  },

  // Get patent category statistics
  getCategoryStats: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const categoryStats = await storage.getPatentCategoryStats(userId);
      res.json(categoryStats);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).json({ message: "Failed to fetch category stats" });
    }
  }
};