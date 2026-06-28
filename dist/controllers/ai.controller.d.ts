import { Request, Response } from 'express';
export declare const aiController: {
    priorArtSearch: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    patentValuation: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    similarityDetection: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    patentDrafting: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=ai.controller.d.ts.map