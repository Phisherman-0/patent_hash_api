import { Request, Response } from 'express';
export declare const patentController: {
    getAll: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getOne: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    create: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    update: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    delete: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=patent.controller.d.ts.map