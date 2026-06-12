import { useState, useCallback, useEffect } from 'react';
import { useSillytavern } from './hooks/useSillytavern';
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
import { StorageModal } from './components/Modals/StorageModalV2';
import { SettingsModal } from './components/SillyTavern/SettingsModal';
import { NotificationCenter, useNotify } from './components/NotificationCenter';
import './styles/tokens.css';
import './App.css';

type PanelId = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map' | 'storage' | null;
type DrawerType = 'realm' | 'status' | 'martial' | null;

function App() {
  const { isLoading, activeChat, isSending, sendMessage, cancelGeneration, streamingText, lastError, clearError } = useSillytavern();
  const { notify } = useNotify();
  const [panel, setPanel] = useState<PanelId>(null);
  const [drawer, setDrawer] = useState<DrawerType>(null);
  const [showSettings, setShowSettings] = useState(false);

  const closePanel = useCallback(() => setPanel(null), []);

  useEffect(() => {
    if (lastError) { notify({ type: 'error', title: '发送失败', message: lastError, duration: 6000 }); clearError(); }
  }, [lastError, notify, clearError]);

  const openDrawer = useCallback((d: DrawerType) => { setDrawer(d); if (d) setPanel(null); }, []);
  const openPanel = useCallback((p: PanelId) => { setPanel(p); setDrawer(null); }, []);
  const handleSend = useCallback((text: string) => { sendMessage(text); }, [sendMessage]);

  if (isLoading) return <div className="dz-loading">大周日暮录</div>;

  return (
    <NotificationCenter>
      <div className="dz-root">
        <div className="dz-body-row">
          <SideNav onOpenPanel={openPanel} onOpenSettings={() => setShowSettings(true)} />

          <main className="dz-main">
            <StoryArea messages={activeChat?.messages || []} streamingText={streamingText} isStreaming={isSending} onOption={handleSend} />
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
        <StorageModal isOpen={panel === 'storage'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      </div>
    </NotificationCenter>
  );
}

export default App;
