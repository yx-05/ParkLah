export declare class ConnectionManagerService {
    private readonly logger;
    private userToSockets;
    private socketToUser;
    registerConnection(userId: string, socketId: string): void;
    removeConnection(socketId: string): string | null;
    getSocketsForUser(userId: string): string[];
    getUserIdForSocket(socketId: string): string | null;
    isUserConnected(userId: string): boolean;
    clear(): void;
}
