import { Request, Response } from 'express';
import { storage } from '../storage';

export const consultantController = {
  getProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const consultant = await storage.getConsultantByUserId(req.user.id);
      if (!consultant) return res.status(404).json({ message: 'Consultant profile not found' });
      res.json(consultant);
    } catch (error) {
      console.error('Error fetching consultant profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateProfile: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const userId = req.user.id;
      const { specialization, bio, experienceYears, hourlyRate, availability } = req.body;

      const existingConsultant = await storage.getConsultantByUserId(userId);
      
      let consultant;
      if (existingConsultant) {
        consultant = await storage.updateConsultant(existingConsultant.id, {
          specialization,
          bio,
          experienceYears,
          hourlyRate,
          availability,
          updatedAt: new Date()
        });
      } else {
        consultant = await storage.createConsultant({
          userId,
          specialization,
          bio,
          experienceYears,
          hourlyRate,
          availability
        });
      }

      res.json(consultant);
    } catch (error) {
      console.error('Error updating consultant profile:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getAll: async (req: Request, res: Response) => {
    try {
      const consultants = await storage.getAllConsultants();
      res.json(consultants);
    } catch (error) {
      console.error('Error fetching consultants:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getBySpecialization: async (req: Request, res: Response) => {
    try {
      const { specialization } = req.params;
      const consultants = await storage.getConsultantsBySpecialization(specialization);
      res.json(consultants);
    } catch (error) {
      console.error('Error fetching consultants by specialization:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
