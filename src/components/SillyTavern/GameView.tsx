import { useState, useCallback } from 'react';
import { useSillytavern } from '../../hooks/useSillytavern';
import { MainTextPane } from './MainTextPane';
import { OptionList } from './OptionList';
import { ThinkingFold } from './ThinkingFold';
import { HistoryDrawer } from './HistoryDrawer';
import { VariablePanel } from './VariablePanel';

export function GameView() {
  const {
    activeChat, isSending, sendMessage, cancelGeneration,
    streamingText, gameBlocks, settings,
  } = useSillytavern();

  const [showHistory, setShowHistory] = useState(false);

  const mainText = gameBlocks?.mainText || '';
  const options = gameBlocks?.options || [];
  const thinking = gameBlocks?.thinking || [];
  const showThinking = settings?.gameSettings?.showThinking ?? true;
  const isStreamingNow = isSending && !!streamingText;

  const handleOption = useCallback(async (option: string) => {
    await sendMessage(option);
  }, [sendMessage]);

  if (!activeChat) {
    return <div className="game-view empty">创建或选择一个对话开始游戏</div>;
  }

  return (
    <div className="game-view">
      {/* Top bar */}
      <div className="game-topbar">
        <VariablePanel />
        <div className="game-info">
          <span>{activeChat.name}</span>
        </div>
        <button onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? '关闭历史' : '📜 历史'}
        </button>
      </div>

      {/* Main play area */}
      <div className="game-main">
        {/* Previous assistant messages (final) */}
        <div className="game-past">
          {activeChat.messages
            .filter(m => m.role === 'assistant')
            .slice(-3)
            .map(msg => (
              <div key={msg.id} className="past-block">
                {msg.content.slice(0, 300)}
                {msg.content.length > 300 ? '...' : ''}
              </div>
            ))}
        </div>

        {/* Current streaming / latest message */}
        <MainTextPane
          text={isStreamingNow ? mainText : activeChat.messages.filter(m => m.role === 'assistant').pop()?.content || ''}
          isStreaming={isStreamingNow}
        />

        {/* Thinking fold */}
        {showThinking && thinking.length > 0 && (
          <ThinkingFold blocks={thinking} />
        )}

        {/* Options */}
        {!isStreamingNow && (
          <OptionList
            options={options}
            onSelect={handleOption}
            disabled={isSending}
            showContinue={settings?.gameSettings?.autoContinue}
          />
        )}

        {/* Free input */}
        <div className="game-input-bar">
          <input
            id="game-input"
            placeholder="输入行动... (或用上方选项)"
            disabled={isSending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                const val = (e.target as HTMLInputElement).value.trim();
                if (val) { sendMessage(val); (e.target as HTMLInputElement).value = ''; }
              }
            }}
          />
          {isSending && <button onClick={cancelGeneration}>⏹ 停止</button>}
        </div>
      </div>

      {/* History drawer */}
      <HistoryDrawer
        messages={activeChat.messages}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
