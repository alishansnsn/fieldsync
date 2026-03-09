export type UserRole = 'technician' | 'supervisor' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar: string;
}

export interface Room {
    id: string;
    title: string;
    createdBy: string;
    status: 'active' | 'inactive';
}

export interface Message {
    id: string;
    roomId: string;
    senderId: string;
    senderName: string;
    senderRole: UserRole;
    senderAvatar: string;
    content: string;
    timestamp: string;
}

export interface Document {
    id: string;
    roomId: string;
    name: string;
    fileUrl: string;
    extractedText?: string;
    uploadedBy: string;
    uploaderName: string;
    timestamp: string;
}

export interface AlertData {
    severity: 'critical' | 'warning' | 'info';
    title: string;
    userStatement: string;
    documentStatement: string;
    recommendation: string;
}

export interface SafetyAlert {
    id: string;
    roomId: string;
    alertData: AlertData;
    messageReference: string;
    timestamp: string;
}

export interface RoomUser {
    id: string;
    name: string;
    role: UserRole;
    avatar: string;
    socketId?: string;
}
