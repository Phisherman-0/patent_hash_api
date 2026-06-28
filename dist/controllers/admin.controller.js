import { storage } from '../storage';
import { db } from '../db';
import { users, appointments } from '../models/index';
import { eq } from 'drizzle-orm';
export const adminController = {
    getAllUsers: async (req, res) => {
        try {
            const allUsers = await db.select().from(users);
            const usersWithoutPasswords = allUsers.map(user => {
                const { passwordHash, ...userWithoutPassword } = user;
                return userWithoutPassword;
            });
            res.json(usersWithoutPasswords);
        }
        catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    updateUserRole: async (req, res) => {
        try {
            const { id } = req.params;
            const { role } = req.body;
            if (!['user', 'consultant', 'admin'].includes(role))
                return res.status(400).json({ message: 'Invalid role' });
            await db.update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
            const [updatedUser] = await db.select().from(users).where(eq(users.id, id));
            if (!updatedUser)
                return res.status(404).json({ message: 'User not found' });
            const { passwordHash, ...userWithoutPassword } = updatedUser;
            res.json(userWithoutPassword);
        }
        catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    getAllAppointments: async (req, res) => {
        try {
            const allAppointments = await db.select().from(appointments);
            res.json(allAppointments);
        }
        catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    deleteUser: async (req, res) => {
        try {
            await db.delete(users).where(eq(users.id, req.params.id));
            res.status(204).send();
        }
        catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    getAllConsultants: async (req, res) => {
        try {
            const allConsultants = await storage.getAllConsultants();
            res.json(allConsultants);
        }
        catch (error) {
            console.error('Error fetching consultants:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    getUnverifiedConsultants: async (req, res) => {
        try {
            const unverifiedConsultants = await storage.getUnverifiedConsultants();
            res.json(unverifiedConsultants);
        }
        catch (error) {
            console.error('Error fetching unverified consultants:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    verifyConsultant: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const { id } = req.params;
            const { notes } = req.body;
            const verifiedConsultant = await storage.verifyConsultant(id, req.user.id, notes);
            if (!verifiedConsultant)
                return res.status(404).json({ message: 'Consultant not found' });
            res.json(verifiedConsultant);
        }
        catch (error) {
            console.error('Error verifying consultant:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    rejectConsultant: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const { id } = req.params;
            const { notes } = req.body;
            const rejectedConsultant = await storage.rejectConsultant(id, req.user.id, notes);
            if (!rejectedConsultant)
                return res.status(404).json({ message: 'Consultant not found' });
            res.json(rejectedConsultant);
        }
        catch (error) {
            console.error('Error rejecting consultant:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    getConsultantStatus: async (req, res) => {
        try {
            const consultant = await storage.getConsultant(req.params.id);
            if (!consultant)
                return res.status(404).json({ message: 'Consultant not found' });
            res.json({
                id: consultant.id,
                isVerified: consultant.isVerified,
                verifiedBy: consultant.verifiedBy,
                verifiedAt: consultant.verifiedAt,
                verificationNotes: consultant.verificationNotes
            });
        }
        catch (error) {
            console.error('Error fetching consultant status:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};
