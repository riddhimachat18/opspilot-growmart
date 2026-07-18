/**
 * useChatSocket.js
 *
 * Manages the WebSocket connection to the OpsPilot backend.
 * Exposes:
 *   messages       — array of {id, role, text, isStreaming}
 *   traceEvents    — array of {id, agent, status, action, detail, timestamp}
 *   activeAgent    — name of the agent currently processing (or null)
 *   isProcessing   — true while the backend is computing a response
 *   sendMessage(text) — sends a user message over the socket
 *   resetSession() — clears local state and sends a new session_id to the backend
 *
 * Message types emitted by the backend:
 *   { type: "token",            content: "..." }
 *   { type: "trace",            agent, status, action?, detail? }
 *   { type: "message_complete" }
 *   { type: "error",            detail: "..." }
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { WS_URL } from '../utils/constants';

let _msgId = 0;
const nextId = () => ++_msgId;

const makeSessionId = () => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function useChatSocket() {
  const [messages, setMessages]       = useState([]);
  const [traceEvents, setTraceEvents] = useState([]);
  const [activeAgent, setActiveAgent] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected]   = useState(false);
  const [statusToast, setStatusToast]   = useState(null);
  // action events from backend (cart_updated, refund_issued etc.)
  const [lastAction, setLastAction]     = useState(null);
  const toastTimerRef = useRef(null);

  const wsRef        = useRef(null);
  const sessionIdRef = useRef(makeSessionId());
  // Tracks the id of the assistant bubble currently being streamed into
  const streamingMsgIdRef = useRef(null);

  // ---------- helpers ----------

  /** Append a token to the latest streaming assistant message */
  const appendToken = useCallback((token) => {
    setMessages((prev) => {
      const id = streamingMsgIdRef.current;
      if (!id) return prev;
      return prev.map((m) =>
        m.id === id ? { ...m, text: m.text + token } : m
      );
    });
  }, []);

  /** Mark the current streaming bubble as finished */
  const finaliseStream = useCallback(() => {
    // Capture the id synchronously before any async state updates can
    // clear it — prevents the cursor staying stuck when token + message_complete
    // arrive in rapid succession and React batches the updates.
    const id = streamingMsgIdRef.current;
    if (!id) return;
    streamingMsgIdRef.current = null;
    setMessages((prev) =>
      prev.map((m) => m.id === id ? { ...m, isStreaming: false } : m)
    );
  }, []);

  // ---------- WebSocket lifecycle ----------

  const connect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[OpsPilot WS] connected');
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[OpsPilot WS] disconnected — will retry in 3s');
      // Auto-reconnect after brief delay
      setTimeout(connect, 3000);
    };

    ws.onerror = (err) => {
      console.warn('[OpsPilot WS] error', err);
    };

    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); }
      catch { return; }

      switch (data.type) {
        case 'token': {
          // First token — create the streaming bubble if it doesn't exist yet
          if (!streamingMsgIdRef.current) {
            const id = nextId();
            streamingMsgIdRef.current = id;
            setMessages((prev) => [
              ...prev,
              { id, role: 'assistant', text: '', isStreaming: true },
            ]);
          }
          appendToken(data.content);
          break;
        }

        case 'action': {
          // Backend signals a real-world action completed (cart add, refund etc.)
          setLastAction(data);
          break;
        }
        case 'status': {
          // Transient toast — display briefly, never append to messages.
          // Used for backend notices like "Summarising context, please wait…"
          if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
          setStatusToast(data.message || null);
          toastTimerRef.current = setTimeout(() => setStatusToast(null), 4000);
          break;
        }

        case 'trace': {
          const { agent, status, action, detail } = data;

          // Track which agent is active
          if (status === 'started') setActiveAgent(agent);
          if (status === 'done')    setActiveAgent(null);

          setTraceEvents((prev) => [
            ...prev,
            {
              id:        nextId(),
              agent:     agent || 'orchestrator',
              status:    status || 'info',
              action:    action || null,
              detail:    detail || null,
              timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            },
          ]);
          break;
        }

        case 'message_complete': {
          finaliseStream();
          setIsProcessing(false);
          setActiveAgent(null);
          break;
        }

        case 'error': {
          console.error('[OpsPilot] backend error:', data.detail);
          finaliseStream();
          setIsProcessing(false);
          setActiveAgent(null);
          setMessages((prev) => [
            ...prev,
            {
              id:   nextId(),
              role: 'error',
              text: data.detail || 'Something went wrong.',
              isStreaming: false,
            },
          ]);
          break;
        }

        default:
          break;
      }
    };
  }, [appendToken, finaliseStream]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  // ---------- public API ----------

  const sendMessage = useCallback(
    (text) => {
      if (!text.trim()) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('[OpsPilot WS] not connected, cannot send');
        return;
      }

      // Add user bubble immediately
      setMessages((prev) => [
        ...prev,
        { id: nextId(), role: 'user', text, isStreaming: false },
      ]);
      setIsProcessing(true);

      wsRef.current.send(
        JSON.stringify({
          message:    text,
          session_id: sessionIdRef.current,
          user_id:    'user-aditi',
        })
      );
    },
    []
  );

  const resetSession = useCallback(() => {
    sessionIdRef.current = makeSessionId();
    setMessages([]);
    setTraceEvents([]);
    setActiveAgent(null);
    setIsProcessing(false);
    setStatusToast(null);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    streamingMsgIdRef.current = null;
  }, []);

  return {
    messages,
    traceEvents,
    activeAgent,
    isProcessing,
    isConnected,
    statusToast,
    lastAction,
    sendMessage,
    resetSession,
  };
}
