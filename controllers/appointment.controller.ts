import { Request, Response } from 'express';
import { storage } from '../storage';

export const appointmentController = {
  book: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const userId = req.user.id;
      const { consultantId, title, description, appointmentDate, duration } = req.body;

      const consultant = await storage.getConsultant(consultantId);
      if (!consultant) return res.status(404).json({ message: 'Consultant not found' });

      const appointment = await storage.createAppointment({
        userId,
        consultantId,
        title,
        description,
        appointmentDate: new Date(appointmentDate),
        duration,
        status: 'pending'
      });

      res.status(201).json(appointment);
    } catch (error) {
      console.error('Error booking appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getUserAppointments: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const appointments = await storage.getAppointmentsByUser(req.user.id);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching user appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  getConsultantAppointments: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const consultant = await storage.getConsultantByUserId(req.user.id);
      if (!consultant) return res.json([]);

      const appointments = await storage.getAppointmentsByConsultant(consultant.id);
      res.json(appointments);
    } catch (error) {
      console.error('Error fetching consultant appointments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const { id } = req.params;
      const { status, meetingLink } = req.body;

      const consultant = await storage.getConsultantByUserId(req.user.id);
      if (!consultant) return res.status(404).json({ message: 'Consultant profile not found' });

      const appointment = await storage.getAppointment(id);
      if (!appointment || appointment.consultantId !== consultant.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedAppointment = await storage.updateAppointment(id, {
        status,
        meetingLink,
        updatedAt: new Date()
      });

      if (!updatedAppointment) return res.status(404).json({ message: 'Appointment not found' });
      res.json(updatedAppointment);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment || appointment.userId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      await storage.deleteAppointment(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error canceling appointment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
