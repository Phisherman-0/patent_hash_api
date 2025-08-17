import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email: string | null;
                firstName: string | null;
                lastName: string | null;
                profileImageUrl: string | null;
                role: string | null;
                createdAt: Date | null;
                updatedAt: Date | null;
            };
        }
    }
}
export declare function hashPassword(password: string): Promise<string>;
export declare function comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean>;
export declare function requireAuth(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
export declare function register(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function login(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function logout(req: Request, res: Response): Promise<void>;
export declare function getCurrentUser(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=auth.d.ts.map