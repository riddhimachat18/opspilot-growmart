import { useState } from 'react';
import TopBar from '../components/TopBar';
import ChatWindow from '../components/ChatWindow';
import TracePanel from '../components/TracePanel';
import { useChatSocket } from '../hooks/useChatSocket';

export default function ChatPage() {
  const [showTrace, setShowTrace] = useState(true);

  const {
    messages, traceEvents, activeAgent,
    isProcessing, isConnected, statusToast,
    sendMessage, resetSession,
  } = useChatSocket();

  return (
    <div className="flex flex-col h-full" style={{ position: 'relative' }}>
      <TopBar
        showTrace={showTrace}
        onToggleTrace={() => setShowTrace((v) => !v)}
        onReset={resetSession}
        isConnected={isConnected}
        activeAgent={activeAgent}
      />

      {/* Status toast — fades in/out, never touches message history */}
      {statusToast && (
        <div
          className="animate-fade-in"
          style={{
            position: 'absolute', top: 62, left: '50%', transform: 'translateX(-50%)',
            backgroundColor: 'var(--op-raised, #181E2C)',
            border: '1px solid var(--op-border2, rgba(255,255,255,0.12))',
            color: 'var(--op-ink2, #8899BB)',
            fontSize: 12, fontFamily: 'Inter, sans-serif',
            padding: '7px 16px', borderRadius: 999,
            zIndex: 100, whiteSpace: 'nowrap',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
          role="status"
          aria-live="polite"
        >
          {statusToast}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <ChatWindow
          messages={messages}
          activeAgent={activeAgent}
          isProcessing={isProcessing}
          onSend={sendMessage}
        />
        <TracePanel
          events={traceEvents}
          activeAgent={activeAgent}
          isVisible={showTrace}
        />
      </div>
    </div>
  );
}
