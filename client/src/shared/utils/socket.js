/**
 * Socket.IO client singleton
 *
 * - connect(token)  — call after login with the access token
 * - disconnect()    — call on logout
 * - getSocket()     — returns the current socket instance (or null)
 *
 * The socket authenticates via `auth.token` in the handshake, which the
 * server's Socket.IO middleware verifies with jwt.verify().
 */

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let _socket = null;

export const socketManager = {
  connect(token) {
    // Already connected — nothing to do
    if (_socket?.connected) return _socket;

    // Clean up any stale disconnected socket before creating a new one
    if (_socket) {
      _socket.removeAllListeners();
      _socket.disconnect();
      _socket = null;
    }

    _socket = io(SOCKET_URL, {
      auth:             { token },
      transports:       ['websocket', 'polling'],
      reconnection:     true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout:          10000,
    });

    _socket.on('connect', () => {
      console.debug('[socket] connected', _socket.id);
    });

    _socket.on('connect_error', (err) => {
      console.warn('[socket] connection error:', err.message);
    });

    _socket.on('disconnect', (reason) => {
      console.debug('[socket] disconnected:', reason);
    });

    return _socket;
  },

  disconnect() {
    if (_socket) {
      _socket.removeAllListeners();
      _socket.disconnect();
      _socket = null;
    }
  },

  getSocket() {
    return _socket;
  },
};
