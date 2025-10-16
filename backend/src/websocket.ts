import { WebSocketServer } from 'ws';
import * as Y from 'yjs';

const WS_PORT = process.env.WS_PORT || 1234;

const wss = new WebSocketServer({ port: Number(WS_PORT) });

// Store Y.Doc instances per document
const docs = new Map<string, Y.Doc>();

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');

  // Basic WebSocket handling - we'll implement proper Y.js sync in Phase 4
  ws.on('message', (message) => {
    console.log('Received message:', message);
    // Echo back for now
    ws.send(message);
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.send('Connected to UltraWrite WebSocket server');
});

console.log(`🔌 WebSocket server running on ws://localhost:${WS_PORT}`);

export default wss;
