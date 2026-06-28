import { Request, Response } from 'express';
export declare const dashboardController: {
    getStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getActivities: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getCategoryStats: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=dashboard.controller.d.ts.map