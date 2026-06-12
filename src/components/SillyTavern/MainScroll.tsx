import { type ChatMessage, ASSISTANT_ROLE } from '../../sillytavern';

interface Props {
  messages: ChatMessage[];
  streamingText?: string;
  isStreaming?: boolean;
}

export function MainScroll({ messages, streamingText, isStreaming }: Props) {
  const latestAssistant = [...messages].reverse().find(m => m.role === ASSISTANT_ROLE);
  const historyMessages = messages.filter(m => m.role === ASSISTANT_ROLE && m.id !== latestAssistant?.id).slice(-3);

  return (
    <div>
      {/* History (faded) */}
      {historyMessages.map(msg => (
        <div key={msg.id} className="story-history">
          {msg.content.slice(0, 400)}{msg.content.length > 400 ? '……' : ''}
        </div>
      ))}

      {/* Current / streaming */}
      <div className="story-paper">
        {latestAssistant?.content || (isStreaming ? '' : '等待故事展开…')}
        {isStreaming && streamingText ? (
          <>
            {streamingText}
            <span className="ink-cursor" />
          </>
        ) : null}
      </div>
    </div>
  );
}
