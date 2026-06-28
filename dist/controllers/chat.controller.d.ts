import { Request, Response } from 'express';
export declare const chatController: {
    createOrGetRoom: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getRooms: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    getMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
    sendMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=chat.controller.d.ts.map