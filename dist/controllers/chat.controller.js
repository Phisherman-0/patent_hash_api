import { storage } from '../storage';
export const chatController = {
    createOrGetRoom: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const { userId, consultantId } = req.body;
            const participantUserId = req.user.role === 'user' ? req.user.id : userId;
            const participantConsultantId = req.user.role === 'consultant' ?
                (await storage.getConsultantByUserId(req.user.id))?.id : consultantId;
            if (!participantUserId || !participantConsultantId) {
                return res.status(400).json({ message: 'User ID and consultant ID are required' });
            }
            const chatRoom = await storage.createChatRoom(participantUserId, participantConsultantId);
            res.json(chatRoom);
        }
        catch (error) {
            console.error('Error creating chat room:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    getRooms: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            let chatRooms;
            if (req.user.role === 'user') {
                chatRooms = await storage.getChatRoomsByUser(req.user.id);
            }
            else if (req.user.role === 'consultant') {
                const consultant = await storage.getConsultantByUserId(req.user.id);
                if (!consultant)
                    return res.json([]);
                chatRooms = await storage.getChatRoomsByConsultant(consultant.id);
            }
            else {
                return res.status(403).json({ message: 'Access denied' });
            }
            res.json(chatRooms);
        }
        catch (error) {
            console.error('Error fetching chat rooms:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    getMessages: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const { roomId } = req.params;
            const chatRoom = await storage.getChatRoom(roomId);
            if (!chatRoom)
                return res.status(404).json({ message: 'Chat room not found' });
            const isParticipant = chatRoom.userId === req.user.id ||
                (await storage.getConsultantByUserId(req.user.id))?.id === chatRoom.consultantId;
            if (!isParticipant)
                return res.status(403).json({ message: 'Access denied' });
            const messages = await storage.getChatMessages(roomId);
            res.json(messages);
        }
        catch (error) {
            console.error('Error fetching chat messages:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    },
    sendMessage: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const { chatRoomId, message } = req.body;
            const chatRoom = await storage.getChatRoom(chatRoomId);
            if (!chatRoom)
                return res.status(404).json({ message: 'Chat room not found' });
            const isParticipant = chatRoom.userId === req.user.id ||
                (await storage.getConsultantByUserId(req.user.id))?.id === chatRoom.consultantId;
            if (!isParticipant)
                return res.status(403).json({ message: 'Access denied' });
            const chatMessage = await storage.createChatMessage({
                chatRoomId,
                senderId: req.user.id,
                message
            });
            res.status(201).json(chatMessage);
        }
        catch (error) {
            console.error('Error sending chat message:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};
