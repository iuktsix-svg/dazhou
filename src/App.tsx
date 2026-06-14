import { useState, useCallback, useEffect } from 'react';
import { useSillytavern } from './hooks/useSillytavern';
import { useTheme } from './hooks/useTheme';
import { SideNav } from './components/SideNav';
import { StoryArea } from './components/StoryArea';
import { CommandBar } from './components/CommandBar';
import { RightPanel } from './components/RightPanel';
import { StatusModal } from './components/Modals/StatusModalV2';
import { ContactsModal } from './components/Modals/ContactsModalV2';
import { BagModal } from './components/Modals/BagModalV2';
import { NewsModal } from './components/Modals/NewsModalV2';
import { LeaderboardModal } from './components/Modals/LeaderboardModalV2';
import { MapModal } from './components/Modals/MapModalV2';
import { BountyModal } from './components/Modals/BountyModal';
import { StorageModal } from './components/Modals/StorageModalV2';
import { SettingsModal } from './components/SillyTavern/SettingsModal';
import { WelcomePage } from './components/WelcomePage';
import { NewGameFlow } from './components/NewGameFlow';
import { ArchiveModal } from './components/ArchiveModal';
import { ChangelogModal } from './components/ChangelogModal';
import { NotificationCenter, useNotify } from './components/NotificationCenter';
import { FullscreenToggle } from './components/FullscreenToggle';
import './styles/tokens.css';
import './App.css';

type PanelId = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map' | 'storage' | 'bounty' | null;
type DrawerType = 'realm' | 'status' | 'martial' | null;

function App() {
  const { isLoading, activeChat, activeChatId, chats, isSending, sendMessage, cancelGeneration, streamingText, lastError, clearError, setChats, setActiveChatId, editMessage, deleteMessagesFrom } = useSillytavern();
  const { notify } = useNotify();
  const { theme, toggle: toggleTheme } = useTheme();
  const [panel, setPanel] = useState<PanelId>(null);
  const [drawer, setDrawer] = useState<DrawerType>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showNewGame, setShowNewGame] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  const closePanel = useCallback(() => setPanel(null), []);

  useEffect(() => {
    if (lastError) { notify({ type: 'error', title: '发送失败', message: lastError, duration: 6000 }); clearError(); }
  }, [lastError, notify, clearError]);

  const openDrawer = useCallback((d: DrawerType) => { setDrawer(d); if (d) setPanel(null); }, []);
  const openPanel = useCallback((p: PanelId) => { setPanel(p); setDrawer(null); }, []);
  const handleSend = useCallback((text: string) => { sendMessage(text); }, [sendMessage]);
  const handleRegenerate = useCallback(() => {
    const msgs = activeChat?.messages || [];
    const lastAI = [...msgs].reverse().find(m => m.role === 'assistant');
    const lastUser = [...msgs].reverse().find(m => m.role === 'user');
    if (lastAI) deleteMessagesFrom(lastAI.id);
    if (lastUser) sendMessage(lastUser.content);
  }, [activeChat, deleteMessagesFrom, sendMessage]);
  const handleEditMessage = useCallback((id: string, text: string) => { editMessage(id, text); }, [editMessage]);

  // Auto-select first chat when entering main game with chats but no active
  useEffect(() => {
    if (!showWelcome && !showNewGame && chats.length > 0 && !activeChat) {
      setActiveChatId(chats[0].id);
    }
  }, [showWelcome, showNewGame, chats, activeChat]);

  if (isLoading) return <div className="dz-loading">大周日暮录</div>;

  return (
    <NotificationCenter>
      {showNewGame ? (
        <NewGameFlow onStart={(chat) => { if (chat) { console.log("[App] onStart chat var keys:", Object.keys(chat.variables)); setChats(prev => [...prev, chat]); setActiveChatId(chat.id); } setShowNewGame(false); setShowWelcome(false); }} />
      ) : showWelcome ? (
        <WelcomePage
          onNewGame={() => { setShowNewGame(true); }}
          onLoadGame={() => { setShowArchive(true); }}
          onSettings={() => { setShowSettings(true); }}
          onChangelog={() => { setShowChangelog(true); }}
        />
      ) : (
        <div className="dz-root">
        <div className="dz-body-row">
          <SideNav onOpenPanel={openPanel} onOpenSettings={() => setShowSettings(true)} onHome={() => setShowWelcome(true)} theme={theme} onToggleTheme={toggleTheme} />

          <main className="dz-main">
            <StoryArea messages={activeChat?.messages || []} streamingText={streamingText} isStreaming={isSending}
              chatId={activeChatId}
              statusLocation={(()=>{ const c = chats.find(x=>x.id===activeChatId); return (c?.variables as any)?.['主角状态']?.['当前所在地点'] || ''; })()}
              statusTime={(()=>{ const c = chats.find(x=>x.id===activeChatId); return (c?.variables as any)?.['系统与时辰']?.['当前时辰'] || ''; })()}
              onOption={handleSend} onRegenerate={handleRegenerate} onEditMessage={handleEditMessage} />
            <CommandBar onSend={handleSend} onStop={cancelGeneration} isSending={isSending} chat={activeChat} />
          </main>

          <RightPanel chat={activeChat} openDrawer={drawer} onOpenDrawer={openDrawer}
            onOpenBag={() => openPanel('bag')} onOpenStorage={() => openPanel('storage')} />
        </div>

        <div className={`dz-overlay ${panel ? 'on' : ''}`} onClick={closePanel} />

        <StatusModal isOpen={panel === 'status'} onClose={closePanel} />
        <ContactsModal isOpen={panel === 'contacts'} onClose={closePanel} />
        <BagModal isOpen={panel === 'bag'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />
        <NewsModal isOpen={panel === 'news'} onClose={closePanel} />
        <LeaderboardModal isOpen={panel === 'leaderboard'} onClose={closePanel} />
        <MapModal isOpen={panel === 'map'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />
        <BountyModal isOpen={panel === 'bounty'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />
        <StorageModal isOpen={panel === 'storage'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />

          {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
          {showArchive && <ArchiveModal onClose={() => setShowArchive(false)} onEnterGame={() => { setShowArchive(false); setShowWelcome(false); }} />}
        </div>
      )}
      {/* Modals always render regardless of welcome state */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showArchive && <ArchiveModal onClose={() => setShowArchive(false)} onEnterGame={() => { setShowArchive(false); setShowWelcome(false); }} />}
      {showChangelog && <ChangelogModal onClose={() => setShowChangelog(false)} />}
      <FullscreenToggle />
    </NotificationCenter>
  );
}

export default App;
