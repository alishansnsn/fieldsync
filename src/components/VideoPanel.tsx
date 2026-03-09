import { useEffect, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-react';
import type {
    IAgoraRTCClient, ICameraVideoTrack, IMicrophoneAudioTrack, IRemoteVideoTrack, IRemoteAudioTrack
} from 'agora-rtc-react';
import { VideoCamera, VideoCameraSlash, Microphone, MicrophoneSlash, PhoneDisconnect, PhoneCall, Monitor } from '@phosphor-icons/react';
import type { RoomUser } from '../types';
import { useAuth } from '../contexts/AuthContext';

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID || 'demo';
const AGORA_TOKEN = import.meta.env.VITE_AGORA_TOKEN || null;
const AGORA_CHANNEL = import.meta.env.VITE_AGORA_CHANNEL || null;

interface Props {
    roomId: string;
    videoEnabled: boolean;
    audioEnabled: boolean;
    onVideoToggle: () => void;
    onAudioToggle: () => void;
    onJoinChange: (joined: boolean) => void;
    roomUsers: RoomUser[];
}

interface RemoteUser {
    uid: string | number;
    videoTrack?: IRemoteVideoTrack;
    audioTrack?: IRemoteAudioTrack;
}

export default function VideoPanel({
    roomId, videoEnabled, audioEnabled,
    onVideoToggle, onAudioToggle, onJoinChange, roomUsers
}: Props) {
    const { user } = useAuth();
    const [joined, setJoined] = useState(false);
    const [joining, setJoining] = useState(false);
    const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
    const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
    const [remoteUsers, setRemoteUsers] = useState<RemoteUser[]>([]);
    const [error, setError] = useState<string>('');
    const clientRef = useRef<IAgoraRTCClient | null>(null);
    const localVideoRef = useRef<HTMLDivElement>(null);
    const remoteVideoRefs = useRef<Map<string | number, HTMLDivElement>>(new Map());

    const joinCall = async () => {
        if (joined || joining) return;
        setJoining(true);
        setError('');
        try {
            const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
            clientRef.current = client;

            // Remote user events
            client.on('user-published', async (remoteUser, mediaType) => {
                await client.subscribe(remoteUser, mediaType);
                if (mediaType === 'video') {
                    setRemoteUsers(prev => {
                        const existing = prev.find(u => u.uid === remoteUser.uid);
                        if (existing) {
                            return prev.map(u => u.uid === remoteUser.uid ? { ...u, videoTrack: remoteUser.videoTrack } : u);
                        }
                        return [...prev, { uid: remoteUser.uid, videoTrack: remoteUser.videoTrack }];
                    });
                    // Play after state update
                    setTimeout(() => {
                        const el = remoteVideoRefs.current.get(remoteUser.uid);
                        if (el && remoteUser.videoTrack) remoteUser.videoTrack.play(el);
                    }, 300);
                }
                if (mediaType === 'audio' && remoteUser.audioTrack) {
                    remoteUser.audioTrack.play();
                    setRemoteUsers(prev => prev.map(u => u.uid === remoteUser.uid ? { ...u, audioTrack: remoteUser.audioTrack } : u));
                }
            });

            client.on('user-unpublished', (remoteUser) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
            });

            client.on('user-left', (remoteUser) => {
                setRemoteUsers(prev => prev.filter(u => u.uid !== remoteUser.uid));
            });

            // Join channel — use a non-zero integer UID
            const uid = Math.floor(Math.random() * 100000) + 1;
            const channel = AGORA_CHANNEL || roomId;
            await client.join(AGORA_APP_ID, channel, AGORA_TOKEN, uid);

            // Create tracks
            const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            setLocalAudioTrack(audioTrack);
            setLocalVideoTrack(videoTrack);

            // Publish
            await client.publish([audioTrack, videoTrack]);

            // Play local video
            if (localVideoRef.current) videoTrack.play(localVideoRef.current);

            setJoined(true);
            onJoinChange(true);
        } catch (err: unknown) {
            console.error('Agora error:', err);
            const msg = err instanceof Error ? err.message : String(err);
            // If no Agora credentials, show mock video UI
            if (msg.includes('DYNAMIC_KEY') || msg.includes('invalid') || msg.includes('demo') || msg.includes('GATEWAY') || msg.includes('static key') || AGORA_APP_ID === 'demo') {
                setError('demo');
                setJoined(true); // Show mock UI
                onJoinChange(true);
            } else {
                setError(msg);
            }
        } finally {
            setJoining(false);
        }
    };

    const leaveCall = async () => {
        if (localVideoTrack) { localVideoTrack.stop(); localVideoTrack.close(); }
        if (localAudioTrack) { localAudioTrack.stop(); localAudioTrack.close(); }
        if (clientRef.current) await clientRef.current.leave();
        setJoined(false);
        setRemoteUsers([]);
        setLocalVideoTrack(null);
        setLocalAudioTrack(null);
        onJoinChange(false);
        setError('');
    };

    useEffect(() => {
        if (joined && localVideoTrack && localVideoRef.current) {
            localVideoTrack.play(localVideoRef.current);
        }
    }, [joined, localVideoTrack]);

    // Toggle video
    useEffect(() => {
        if (localVideoTrack) {
            localVideoTrack.setEnabled(videoEnabled).catch(console.error);
        }
    }, [videoEnabled, localVideoTrack]);

    // Toggle audio
    useEffect(() => {
        if (localAudioTrack) {
            localAudioTrack.setEnabled(audioEnabled).catch(console.error);
        }
    }, [audioEnabled, localAudioTrack]);

    useEffect(() => {
        return () => {
            leaveCall();
        };
    }, []);

    const isDemo = error === 'demo' || AGORA_APP_ID === 'demo';

    return (
        <div className="video-panel">
            {!joined ? (
                /* Pre-join lobby */
                <div className="video-lobby">
                    <div className="lobby-content">
                        <div className="lobby-icon">
                            <VideoCamera size={24} weight="light" />
                        </div>
                        <h3>Join Video Call</h3>
                        {error && error !== 'demo' && (
                            <div className="video-error">Connection failed: {error}</div>
                        )}
                        <div className="lobby-users">
                            {roomUsers.map(u => (
                                <div key={u.id} className="lobby-user-chip">
                                    <div className={`avatar avatar-sm ${u.role}`}>{u.avatar}</div>
                                    <span>{u.name}</span>
                                </div>
                            ))}
                        </div>
                        <button className="btn btn-primary" onClick={joinCall} disabled={joining}>
                            {joining ? (
                                <><div className="loading-spinner" style={{ width: 16, height: 16 }} /> Connecting...</>
                            ) : (
                                <><PhoneCall size={18} weight="bold" /> Join Call</>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                /* Active call */
                <div className="video-grid-container">
                    <div className={`video-grid users-${Math.min(1 + remoteUsers.length, 4)}`}>
                        {/* Local */}
                        <div className="video-tile local-tile">
                            {isDemo || !videoEnabled ? (
                                <div className="video-placeholder">
                                    <div className={`avatar avatar-lg ${user?.role}`}>{user?.avatar}</div>
                                    <div className="video-placeholder-name">{user?.name}</div>
                                </div>
                            ) : (
                                <div ref={localVideoRef} className="video-stream" />
                            )}
                            <div className="video-tile-meta">
                                <span>{user?.name} (You)</span>
                                {!audioEnabled && <MicrophoneSlash size={14} weight="bold" />}
                            </div>
                        </div>

                        {/* Remote — or mock participants in demo mode */}
                        {isDemo ? (
                            roomUsers.filter(u => u.id !== user?.id).map(ru => (
                                <div key={ru.id} className="video-tile">
                                    <div className="video-placeholder">
                                        <div className={`avatar avatar-lg ${ru.role}`}>{ru.avatar}</div>
                                        <div className="video-placeholder-name">{ru.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                            Waiting for camera
                                        </div>
                                    </div>
                                    <div className="video-tile-meta">
                                        <span>{ru.name}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            remoteUsers.map(ru => (
                                <div key={ru.uid} className="video-tile">
                                    <div
                                        ref={el => { if (el) remoteVideoRefs.current.set(ru.uid, el); }}
                                        className="video-stream"
                                    />
                                    <div className="video-tile-meta">
                                        <span>Remote #{ru.uid}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Call Controls */}
                    <div className="video-controls">
                        <button
                            className={`btn-icon ${!audioEnabled ? 'danger' : ''}`}
                            onClick={onAudioToggle}
                            title={audioEnabled ? 'Mute' : 'Unmute'}
                            style={{ background: 'none' }}
                        >
                            {audioEnabled ? <Microphone size={20} weight="bold" /> : <MicrophoneSlash size={20} weight="bold" />}
                        </button>
                        <button
                            className={`btn-icon ${!videoEnabled ? 'danger' : ''}`}
                            onClick={onVideoToggle}
                            title={videoEnabled ? 'Stop Video' : 'Start Video'}
                            style={{ background: 'none' }}
                        >
                            {videoEnabled ? <VideoCamera size={20} weight="bold" /> : <VideoCameraSlash size={20} weight="bold" />}
                        </button>
                        <button className="btn-icon danger" onClick={leaveCall} title="Leave Call" style={{ background: 'none' }}>
                            <PhoneDisconnect size={20} weight="bold" />
                        </button>
                    </div>

                    {isDemo && (
                        <div className="demo-badge">
                            <Monitor size={14} weight="bold" />
                            Adaptive Bitrate — Optimized for low-bandwidth environments
                        </div>
                    )}
                </div>
            )}

            <style>{`
        .video-panel {
          flex: 1;
          background: var(--bg-primary);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .video-lobby {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        .lobby-content {
          text-align: center;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }
        .lobby-icon {
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          margin-bottom: 8px;
        }
        .lobby-users {
          display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
        }
        .lobby-user-chip {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 6px 12px 6px 6px;
          font-size: 0.8rem;
        }
        .video-error {
          background: var(--danger-dim); border: 1px solid rgba(255,59,92,0.3);
          border-radius: var(--radius-sm); padding: 10px 14px;
          font-size: 0.82rem; color: var(--danger);
        }
        .video-grid-container {
          flex: 1; display: flex; flex-direction: column; overflow: hidden; position: relative;
        }
        .video-grid {
          flex: 1; display: grid; gap: 8px; padding: 12px; overflow: hidden;
          background: #050a0f;
        }
        .video-grid.users-1 { grid-template-columns: 1fr; }
        .video-grid.users-2 { grid-template-columns: 1fr 1fr; }
        .video-grid.users-3,
        .video-grid.users-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
        .video-tile {
          background: #0a1220;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
          position: relative;
          min-height: 120px;
        }
        .video-stream { width: 100%; height: 100%; object-fit: cover; }
        .video-placeholder {
          width: 100%; height: 100%; min-height: 120px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 10px; background: var(--bg-base);
        }
        .video-placeholder-name { font-size: 0.8rem; font-weight: 600; }
        .video-tile-meta {
          position: absolute; bottom: 8px; left: 8px;
          display: flex; align-items: center; gap: 6px;
          background: rgba(0,0,0,0.75);
          border-radius: 6px; padding: 4px 8px;
          font-size: 0.72rem; font-weight: 500;
        }
        .video-controls {
          display: flex; justify-content: center; gap: 12px;
          padding: 14px; border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .video-controls .btn-icon {
          width: 44px; height: 44px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .demo-badge {
          position: absolute; top: 20px; left: 50%; transform: translateX(-50%);
          background: var(--bg-overlay);
          border: 1px solid var(--border); border-radius: var(--radius-sm);
          padding: 6px 14px; font-size: 0.72rem; color: var(--text-muted);
          display: flex; align-items: center; gap: 6px;
          pointer-events: none;
          white-space: nowrap;
        }
        @media (max-width: 640px) {
          .video-lobby {
            padding: 20px 16px;
          }
          .lobby-content {
            gap: 12px;
          }
          .lobby-content h3 {
            font-size: 0.9375rem;
          }
          .video-grid {
            padding: 6px;
            gap: 4px;
          }
          .video-grid.users-2,
          .video-grid.users-3,
          .video-grid.users-4 {
            grid-template-columns: 1fr;
          }
          .video-tile {
            min-height: 140px;
          }
          .video-controls {
            padding: 10px;
            gap: 16px;
          }
          .video-controls .btn-icon {
            width: 48px;
            height: 48px;
          }
          .demo-badge {
            font-size: 0.625rem;
            padding: 5px 10px;
            max-width: calc(100% - 24px);
            white-space: normal;
            text-align: center;
            top: 10px;
          }
          .video-placeholder-name {
            font-size: 0.75rem;
          }
          .video-tile-meta {
            font-size: 0.65rem;
            padding: 3px 6px;
            bottom: 4px;
            left: 4px;
          }
        }
      `}</style>
        </div>
    );
}
