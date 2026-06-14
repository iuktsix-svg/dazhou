import { useState, useCallback, useEffect, lazy, Suspense } from 'react';
import { useSillytavern } from './hooks/useSillytavern';
import { useTheme } from './hooks/useTheme';
import { SideNav } from './components/SideNav';
import { StoryArea } from './components/StoryArea';
import { CommandBar } from './components/CommandBar';
import { NotificationCenter, useNotify } from './components/NotificationCenter';
import { FullscreenToggle } from './components/FullscreenToggle';
import './styles/tokens.css';
import './App.css';

// Lazy-loaded — only fetched when user triggers them
const RightPanel = lazy(() => import('./components/RightPanel').then(m => ({ default: m.RightPanel })));
const SettingsModal = lazy(() => import('./components/SillyTavern/SettingsModal').then(m => ({ default: m.SettingsModal })));
const WelcomePage = lazy(() => import('./components/WelcomePage').then(m => ({ default: m.WelcomePage })));
const NewGameFlow = lazy(() => import('./components/NewGameFlow').then(m => ({ default: m.NewGameFlow })));
const ArchiveModal = lazy(() => import('./components/ArchiveModal').then(m => ({ default: m.ArchiveModal })));
const ChangelogModal = lazy(() => import('./components/ChangelogModal').then(m => ({ default: m.ChangelogModal })));
const StatusModal = lazy(() => import('./components/Modals/StatusModalV2').then(m => ({ default: m.StatusModal })));
const ContactsModal = lazy(() => import('./components/Modals/ContactsModalV2').then(m => ({ default: m.ContactsModal })));
const BagModal = lazy(() => import('./components/Modals/BagModalV2').then(m => ({ default: m.BagModal })));
const NewsModal = lazy(() => import('./components/Modals/NewsModalV2').then(m => ({ default: m.NewsModal })));
const LeaderboardModal = lazy(() => import('./components/Modals/LeaderboardModalV2').then(m => ({ default: m.LeaderboardModal })));
const MapModal = lazy(() => import('./components/Modals/MapModalV2').then(m => ({ default: m.MapModal })));
const BountyModal = lazy(() => import('./components/Modals/BountyModal').then(m => ({ default: m.BountyModal })));
const StorageModal = lazy(() => import('./components/Modals/StorageModalV2').then(m => ({ default: m.StorageModal })));

const LazyFallback = () => <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', zIndex: 199 }}><div className="dz-loading" style={{ fontSize: 'var(--text-lg)' }}>…</div></div>;

type PanelId = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map' | 'storage' | 'bounty' | null;
type DrawerType = 'realm' | 'status' | 'martial' | null;

function App() {
  const { isLoading, activeChat, activeChatId, chats, settings, isSending, sendMessage, cancelGeneration, streamingText, lastError, clearError, setChats, setActiveChatId, editMessage, deleteMessagesFrom } = useSillytavern();
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
      <Suspense fallback={<LazyFallback />}>
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
            <CommandBar onSend={handleSend} onStop={cancelGeneration} isSending={isSending} chat={activeChat} hasApi={settings?.api?.saved?.some(e => e.enabled) ?? false} onOpenSettings={() => setShowSettings(true)} />
          </main>

          <Suspense fallback={null}><RightPanel chat={activeChat} openDrawer={drawer} onOpenDrawer={openDrawer}
            onOpenBag={() => openPanel('bag')} onOpenStorage={() => openPanel('storage')} /></Suspense>
        </div>

        <div className={`dz-overlay ${panel ? 'on' : ''}`} onClick={closePanel} />

        <Suspense fallback={null}><StatusModal isOpen={panel === 'status'} onClose={closePanel} /></Suspense>
        <Suspense fallback={null}><ContactsModal isOpen={panel === 'contacts'} onClose={closePanel} /></Suspense>
        <Suspense fallback={null}><BagModal isOpen={panel === 'bag'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} /></Suspense>
        <Suspense fallback={null}><NewsModal isOpen={panel === 'news'} onClose={closePanel} /></Suspense>
        <Suspense fallback={null}><LeaderboardModal isOpen={panel === 'leaderboard'} onClose={closePanel} /></Suspense>
        <Suspense fallback={null}><MapModal isOpen={panel === 'map'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} /></Suspense>
        <Suspense fallback={null}><BountyModal isOpen={panel === 'bounty'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} /></Suspense>
        <Suspense fallback={null}><StorageModal isOpen={panel === 'storage'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} /></Suspense>

          {showSettings && <Suspense fallback={<LazyFallback />}><SettingsModal onClose={() => setShowSettings(false)} /></Suspense>}
          {showArchive && <Suspense fallback={<LazyFallback />}><ArchiveModal onClose={() => setShowArchive(false)} onEnterGame={() => { setShowArchive(false); setShowWelcome(false); }} /></Suspense>}
        </div>
      )}
      </Suspense>
      {/* Modals always render regardless of welcome state */}
      {showSettings && <Suspense fallback={<LazyFallback />}><SettingsModal onClose={() => setShowSettings(false)} /></Suspense>}
      {showArchive && <Suspense fallback={<LazyFallback />}><ArchiveModal onClose={() => setShowArchive(false)} onEnterGame={() => { setShowArchive(false); setShowWelcome(false); }} /></Suspense>}
      {showChangelog && <Suspense fallback={<LazyFallback />}><ChangelogModal onClose={() => setShowChangelog(false)} /></Suspense>}
      <FullscreenToggle />
    </NotificationCenter>
  );
}

export default App;
