import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || 'demo-key';
const AI_MODEL = 'deepseek/deepseek-v3.2';

const openrouter = createOpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: OPENROUTER_API_KEY,
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

const upload = multer({ dest: path.join(__dirname, 'uploads/') });

/* ─── In-memory DB ─── */
const db = {
    users: [
        { id: 'u1', name: 'Alex Chen', email: 'technician@demo.com', password: 'demo123', role: 'technician', avatar: 'AC' },
        { id: 'u2', name: 'Sarah Williams', email: 'supervisor@demo.com', password: 'demo123', role: 'supervisor', avatar: 'SW' },
        { id: 'u3', name: 'Marcus Johnson', email: 'admin@demo.com', password: 'demo123', role: 'admin', avatar: 'MJ' },
    ],
    rooms: [
        { id: 'room-alpha', title: 'Unit 7 — Hydraulic System Repair', createdBy: 'u2', status: 'active' },
        { id: 'room-beta', title: 'Compressor Station B — Maintenance', createdBy: 'u3', status: 'active' },
    ],
    messages: [],
    documents: [
        {
            id: 'doc-safety-manual',
            roomId: 'room-alpha',
            name: 'Hydraulic System Safety Manual — Rev 4.2',
            fileUrl: null,
            extractedText: `HYDRAULIC SYSTEM SAFETY MANUAL — UNIT 7
Revision 4.2 | Classification: RESTRICTED

SECTION 3: OPERATING PARAMETERS

3.1 PRESSURE LIMITS
Maximum operating pressure: 35 PSI
Nominal operating range: 20-30 PSI
Emergency relief valve set point: 38 PSI
WARNING: Operating above 35 PSI may cause catastrophic seal failure and risk of hydraulic fluid injection injury.

3.2 ELECTRICAL SPECIFICATIONS
Supply voltage: 120V AC, 60Hz single-phase
Control circuit voltage: 24V DC
WARNING: Connecting to 240V supply will damage the control module and void safety certification. Always verify voltage before connecting.

3.3 TEMPERATURE LIMITS
Maximum operating temperature: 150°C
Optimal operating range: 60-120°C
Thermal shutdown threshold: 160°C
WARNING: Sustained operation above 150°C degrades hydraulic fluid viscosity and accelerates seal wear. Monitor temperature continuously during high-load operations.

SECTION 4: LOCKOUT/TAGOUT PROCEDURES
4.1 All maintenance personnel must complete LOTO procedure before servicing.
4.2 Verify zero-energy state before opening any hydraulic circuit.
4.3 Document all pressure readings in the maintenance log before and after service.

SECTION 5: EMERGENCY PROCEDURES
5.1 In case of hydraulic fluid leak, activate emergency stop immediately.
5.2 Do not attempt to tighten fittings under pressure.
5.3 Report all incidents to supervisor within 15 minutes.`,
            uploadedBy: 'u2',
            uploaderName: 'Sarah Williams',
            timestamp: new Date().toISOString(),
        },
    ],
    safetyAlerts: [],
};

/* ─── Auth ─── */
const JWT_SECRET = process.env.JWT_SECRET || 'industrial_ai_secret';

function auth(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
}

/* ─── Routes ─── */
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, role: user.role, avatar: user.avatar }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, avatar: user.avatar, email: user.email } });
});

app.get('/api/rooms', auth, (req, res) => res.json(db.rooms));

app.post('/api/rooms', auth, (req, res) => {
    if (req.user.role === 'technician') return res.status(403).json({ error: 'Forbidden' });
    const room = { id: uuidv4(), title: req.body.title, createdBy: req.user.id, status: 'active' };
    db.rooms.push(room);
    io.emit('room:created', room);
    res.json(room);
});

app.get('/api/rooms/:id/messages', auth, (req, res) => {
    res.json(db.messages.filter(m => m.roomId === req.params.id));
});

app.get('/api/rooms/:id/documents', auth, (req, res) => {
    res.json(db.documents.filter(d => d.roomId === req.params.id));
});

app.get('/api/rooms/:id/alerts', auth, (req, res) => {
    res.json(db.safetyAlerts.filter(a => a.roomId === req.params.id));
});

/* ─── Document Upload ─── */
app.post('/api/rooms/:id/documents', auth, upload.single('document'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) return res.status(400).json({ error: 'No file' });

        let extractedText = '';
        if (file.mimetype === 'application/pdf') {
            try {
                const pdfParse = (await import('pdf-parse')).default;
                const dataBuffer = fs.readFileSync(file.path);
                const pdfData = await pdfParse(dataBuffer);
                extractedText = pdfData.text;
            } catch (e) {
                extractedText = '[PDF text extraction failed]';
            }
        }

        const doc = {
            id: uuidv4(),
            roomId: req.params.id,
            name: file.originalname,
            fileUrl: `/uploads/${file.filename}`,
            extractedText,
            uploadedBy: req.user.id,
            uploaderName: req.user.name,
            timestamp: new Date().toISOString(),
        };
        db.documents.push(doc);
        io.to(req.params.id).emit('document:added', doc);
        res.json(doc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

/* ─── AI Safety Check ─── */
async function runAICheck(roomId, triggerMessage) {
    const roomMessages = db.messages.filter(m => m.roomId === roomId).slice(-20);
    const roomDocs = db.documents.filter(d => d.roomId === roomId);

    if (roomDocs.length === 0) return null;

    const conversationContext = roomMessages
        .map(m => `${m.senderName} (${new Date(m.timestamp).toLocaleTimeString()}): ${m.content}`)
        .join('\n');

    const documentContext = roomDocs
        .map(d => `=== ${d.name} ===\n${d.extractedText?.slice(0, 2000) || '(no text)'}`)
        .join('\n\n');

    const prompt = `You are an industrial safety AI monitoring a field technician collaboration session.

RECENT CONVERSATION:
${conversationContext}

REFERENCE DOCUMENTS:
${documentContext}

LATEST MESSAGE: "${triggerMessage}"

Analyze for SAFETY CONTRADICTIONS between the conversation and reference documents.

Rules:
- Only flag genuine safety conflicts with specific values (voltages, pressures, temperatures, etc.)
- Be specific about what was said vs what the document states
- If no contradiction, respond with exactly: SAFE

If contradiction found, respond in this format:

ANALYSIS: [2-3 sentences explaining the safety concern with specific values]

ALERT_JSON: {"severity":"critical","title":"Brief title","userStatement":"exact user quote","documentStatement":"exact doc quote","recommendation":"corrective action"}`;

    try {
        io.to(roomId).emit('ai:stream', { type: 'start' });

        const result = streamText({
            model: openrouter(AI_MODEL),
            messages: [{ role: 'user', content: prompt }],
            onError({ error }) {
                console.error('[AI] Stream error:', error);
            },
        });

        let fullText = '';
        let emittedLen = 0;

        for await (const chunk of result.textStream) {
            fullText += chunk;

            // Don't stream SAFE responses
            if (fullText.trim().startsWith('SAFE')) continue;

            // Buffer to prevent ALERT_JSON from leaking into visible stream
            const jsonIdx = fullText.indexOf('ALERT_JSON:');
            const safeEnd = jsonIdx !== -1 ? jsonIdx : Math.max(0, fullText.length - 15);
            if (safeEnd > emittedLen) {
                io.to(roomId).emit('ai:stream', { type: 'chunk', text: fullText.slice(emittedLen, safeEnd) });
                emittedLen = safeEnd;
            }
        }

        // Flush remaining visible text
        const jsonIdx = fullText.indexOf('ALERT_JSON:');
        const finalEnd = jsonIdx !== -1 ? jsonIdx : fullText.length;
        if (finalEnd > emittedLen) {
            io.to(roomId).emit('ai:stream', { type: 'chunk', text: fullText.slice(emittedLen, finalEnd) });
        }

        io.to(roomId).emit('ai:stream', { type: 'end' });

        const text = fullText.trim();
        console.log('[AI RAW]', text.slice(0, 500));

        if (text === 'SAFE' || text.startsWith('SAFE')) {
            console.log('[AI] Safe');
            return null;
        }

        // Extract JSON after ALERT_JSON: marker
        const alertIdx = text.indexOf('ALERT_JSON:');
        const jsonStr = alertIdx !== -1 ? text.slice(alertIdx + 11).trim() : text;
        const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.log('[AI] No JSON found in:', jsonStr.slice(0, 100));
            return null;
        }

        let alertData;
        try {
            alertData = JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.log('[AI] JSON parse failed:', e.message);
            return null;
        }

        console.log('[AI] Alert:', alertData.title);
        const alert = {
            id: uuidv4(),
            roomId,
            alertData,
            messageReference: triggerMessage,
            timestamp: new Date().toISOString(),
        };
        db.safetyAlerts.push(alert);
        return alert;
    } catch (err) {
        console.error('[AI] Check error:', err);
        io.to(roomId).emit('ai:stream', { type: 'end' });
        return null;
    }
}

/* ─── WebSocket ─── */
const roomUsers = {};

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('room:join', ({ roomId, user }) => {
        socket.join(roomId);
        socket.data.user = user;
        socket.data.roomId = roomId;

        if (!roomUsers[roomId]) roomUsers[roomId] = [];
        const existing = roomUsers[roomId].find(u => u.id === user.id);
        if (!existing) roomUsers[roomId].push({ ...user, socketId: socket.id });

        io.to(roomId).emit('room:users', roomUsers[roomId]);
        socket.to(roomId).emit('user:joined', user);
        console.log(`${user.name} joined ${roomId}`);
    });

    socket.on('message:send', async ({ roomId, content, sender }) => {
        const message = {
            id: uuidv4(),
            roomId,
            senderId: sender.id,
            senderName: sender.name,
            senderRole: sender.role,
            senderAvatar: sender.avatar,
            content,
            timestamp: new Date().toISOString(),
        };
        db.messages.push(message);
        io.to(roomId).emit('message:new', message);

        try {
            const alert = await runAICheck(roomId, content);
            if (alert) {
                io.to(roomId).emit('safety:alert', alert);
                console.log('Alert:', alert.alertData.title);
            }
        } catch (e) {
            console.error('AI check failed:', e);
        }
    });

    socket.on('room:leave', ({ roomId, userId }) => {
        if (roomUsers[roomId]) {
            roomUsers[roomId] = roomUsers[roomId].filter(u => u.id !== userId);
            io.to(roomId).emit('room:users', roomUsers[roomId]);
        }
    });

    socket.on('disconnect', () => {
        const { roomId, user } = socket.data;
        if (roomId && user && roomUsers[roomId]) {
            roomUsers[roomId] = roomUsers[roomId].filter(u => u.socketId !== socket.id);
            io.to(roomId).emit('room:users', roomUsers[roomId]);
            io.to(roomId).emit('user:left', user);
        }
    });
});

// Serve frontend in production
const frontendPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('/{*splat}', (req, res) => {
        res.sendFile(path.join(frontendPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`\nFieldSync running on port ${PORT}`);
    console.log(`AI: ${AI_MODEL} via OpenRouter\n`);
});
