import { Request, Response } from 'express';
export declare const adminController: {
    getAllUsers: (req: Request, res: Response) => Promise<void>;
    updateUserRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getAllAppointments: (req: Request, res: Response) => Promise<void>;
    deleteUser: (req: Request, res: Response) => Promise<void>;
    getAllConsultants: (req: Request, res: Response) => Promise<void>;
    getUnverifiedConsultants: (req: Request, res: Response) => Promise<void>;
    verifyConsultant: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    rejectConsultant: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getConsultantStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=admin.controller.d.ts.map