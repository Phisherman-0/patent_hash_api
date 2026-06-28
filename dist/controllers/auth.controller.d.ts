import { Request, Response } from 'express';
export declare const authController: {
    register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    logout: (req: Request, res: Response) => Promise<void>;
    getCurrentUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateSettings: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    verifyOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    resendOTP: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    uploadProfileImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    deleteProfileImage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=auth.controller.d.ts.map