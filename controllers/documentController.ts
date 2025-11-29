import { Request, Response } from 'express';
import { storage } from '../storage';
import fs from 'fs';

export const documentController = {
  // Get user documents
  getUserDocuments: async (req: any, res: Response) => {
    try {
      const userId = req.user.id;
      const documents = await storage.getPatentDocumentsByUser(userId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  },

  // Download document
  downloadDocument: async (req: any, res: Response) => {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;
      
      // Get document and verify ownership
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found on disk" });
      }

      // Set appropriate headers for download
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
      res.setHeader('Content-Type', document.fileType);
      
      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  },

  // Delete document
  deleteDocument: async (req: any, res: Response) => {
    try {
      const documentId = req.params.id;
      const userId = req.user.id;
      
      // Get document and verify ownership
      const documents = await storage.getPatentDocumentsByUser(userId);
      const document = documents.find(doc => doc.id === documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Delete the document from storage
      await storage.deletePatentDocument(documentId);
      
      // Delete physical file if it exists
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  }
};