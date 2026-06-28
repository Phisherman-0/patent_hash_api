import { Request, Response } from 'express';
export declare const appointmentController: {
    book: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getUserAppointments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getConsultantAppointments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    updateStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    cancel: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=appointment.controller.d.ts.map