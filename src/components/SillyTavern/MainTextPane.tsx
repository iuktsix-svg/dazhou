interface Props {
  text: string;
  isStreaming?: boolean;
}

export function MainTextPane({ text, isStreaming }: Props) {
  if (!text && !isStreaming) {
    return <div className="maintext-pane empty">等待故事展开...</div>;
  }

  return (
    <div className="maintext-pane">
      <div className="maintext-content">
        {text || '...'}
        {isStreaming && <span className="cursor-blink">▌</span>}
      </div>
    </div>
  );
}
