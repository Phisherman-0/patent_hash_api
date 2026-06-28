import { storage } from '../storage';
import fs from 'fs';
export const documentController = {
    getUserDocuments: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const documents = await storage.getPatentDocumentsByUser(req.user.id);
            res.json(documents);
        }
        catch (error) {
            console.error("Error fetching user documents:", error);
            res.status(500).json({ message: "Failed to fetch documents" });
        }
    },
    downloadDocument: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const documentId = req.params.id;
            const documents = await storage.getPatentDocumentsByUser(req.user.id);
            const document = documents.find(doc => doc.id === documentId);
            if (!document)
                return res.status(404).json({ message: "Document not found" });
            if (!fs.existsSync(document.filePath))
                return res.status(404).json({ message: "File not found on disk" });
            res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
            res.setHeader('Content-Type', document.fileType);
            const fileStream = fs.createReadStream(document.filePath);
            fileStream.pipe(res);
        }
        catch (error) {
            console.error("Error downloading document:", error);
            res.status(500).json({ message: "Failed to download document" });
        }
    },
    deleteDocument: async (req, res) => {
        try {
            if (!req.user)
                return res.status(401).json({ message: 'Unauthorized' });
            const documentId = req.params.id;
            const documents = await storage.getPatentDocumentsByUser(req.user.id);
            const document = documents.find(doc => doc.id === documentId);
            if (!document)
                return res.status(404).json({ message: "Document not found" });
            await storage.deletePatentDocument(documentId);
            if (fs.existsSync(document.filePath))
                fs.unlinkSync(document.filePath);
            res.status(204).send();
        }
        catch (error) {
            console.error("Error deleting document:", error);
            res.status(500).json({ message: "Failed to delete document" });
        }
    }
};
