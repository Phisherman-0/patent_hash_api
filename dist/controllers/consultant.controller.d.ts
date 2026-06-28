import { Request, Response } from 'express';
export declare const consultantController: {
    getProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAll: (req: Request, res: Response) => Promise<void>;
    getBySpecialization: (req: Request, res: Response) => Promise<void>;
};
//# sourceMappingURL=consultant.controller.d.ts.map