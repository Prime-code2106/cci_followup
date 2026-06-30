import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Set<(data: { table: string }) => void> = new Set();

  constructor() {
    try {
      // Connect to same origin / relative path, since client and server share the port
      this.socket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        console.log('🟢 Realtime WebSocket connection established successfully!');
      });

      this.socket.on('db_changed', (data: { table: string }) => {
        console.log('📡 Realtime DB change event received:', data);
        this.listeners.forEach(cb => cb(data));
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔴 Realtime WebSocket disconnected:', reason);
      });
    } catch (err) {
      console.error('Failed to initialize socket connection:', err);
    }
  }

  /**
   * Subscribe to database change events.
   * Returns an unsubscribe function.
   */
  onDbChange(callback: (data: { table: string }) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const socketService = new SocketService();
