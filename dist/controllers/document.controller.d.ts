import { Request, Response } from 'express';
export declare const documentController: {
    getUserDocuments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    downloadDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=document.controller.d.ts.map