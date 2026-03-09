import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Message, SafetyAlert, RoomUser, Document } from '../types';
import { useAuth } from './AuthContext';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

interface SocketContextType {
    socket: Socket | null;
    connected: boolean;
    joinRoom: (roomId: string) => void;
    leaveRoom: (roomId: string) => void;
    sendMessage: (roomId: string, content: string) => void;
    messages: Message[];
    alerts: SafetyAlert[];
    roomUsers: RoomUser[];
    documents: Document[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setAlerts: React.Dispatch<React.SetStateAction<SafetyAlert[]>>;
    setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
    newAlertCount: number;
    clearAlertCount: () => void;
    aiAnalyzing: boolean;
    aiStreamText: string;
    lastAiResult: string;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
    const [roomUsers, setRoomUsers] = useState<RoomUser[]>([]);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [newAlertCount, setNewAlertCount] = useState(0);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiStreamText, setAiStreamText] = useState('');
    const [lastAiResult, setLastAiResult] = useState('');

    useEffect(() => {
        if (!user) return;

        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));

        socket.on('message:new', (msg: Message) => {
            setMessages(prev => [...prev, msg]);
        });

        socket.on('safety:alert', (alert: SafetyAlert) => {
            setAlerts(prev => [...prev, alert]);
            setNewAlertCount(c => c + 1);
        });

        socket.on('room:users', (users: RoomUser[]) => {
            setRoomUsers(users);
        });

        socket.on('document:added', (doc: Document) => {
            setDocuments(prev => [...prev, doc]);
        });

        socket.on('ai:stream', (data: { type: string; text?: string }) => {
            if (data.type === 'start') {
                setAiAnalyzing(true);
                setAiStreamText('');
                setLastAiResult('');
            } else if (data.type === 'chunk' && data.text) {
                setAiStreamText(prev => prev + data.text);
            } else if (data.type === 'end') {
                setAiStreamText(prev => {
                    setLastAiResult(prev);
                    return prev;
                });
                setAiAnalyzing(false);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [user]);

    const joinRoom = (roomId: string) => {
        if (!socketRef.current || !user) return;
        setMessages([]);
        setAlerts([]);
        setDocuments([]);
        setRoomUsers([]);
        setNewAlertCount(0);
        socketRef.current.emit('room:join', { roomId, user });
    };

    const leaveRoom = (roomId: string) => {
        if (!socketRef.current || !user) return;
        socketRef.current.emit('room:leave', { roomId, userId: user.id });
    };

    const sendMessage = (roomId: string, content: string) => {
        if (!socketRef.current || !user) return;
        socketRef.current.emit('message:send', { roomId, content, sender: user });
    };

    const clearAlertCount = () => setNewAlertCount(0);

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            connected,
            joinRoom,
            leaveRoom,
            sendMessage,
            messages,
            alerts,
            roomUsers,
            documents,
            setMessages,
            setAlerts,
            setDocuments,
            newAlertCount,
            clearAlertCount,
            aiAnalyzing,
            aiStreamText,
            lastAiResult,
        }}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
}
