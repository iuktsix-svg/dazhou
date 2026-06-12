import { useState, useCallback } from 'react';
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
import { ChatModal } from './components/SillyTavern/ChatModal';
import { NotificationCenter } from './components/NotificationCenter';
import './styles/tokens.css';
import './App.css';

type PageId = 'story' | 'chats' | 'settings';
type PanelId = 'status' | 'contacts' | 'bag' | 'news' | 'leaderboard' | 'map' | 'storage' | null;
type DrawerType = 'realm' | 'status' | 'martial' | null;

function App() {
  const { isLoading, activeChat, chats, isSending, sendMessage, cancelGeneration, streamingText } = useSillytavern();
  const [page, setPage] = useState<PageId>('story');
  const [panel, setPanel] = useState<PanelId>(null);
  const [drawer, setDrawer] = useState<DrawerType>(null);

  const closePanel = useCallback(() => setPanel(null), []);
  const openDrawer = useCallback((d: DrawerType) => { setDrawer(d); if (d) setPanel(null); }, []);
  const openPanelWithAccordion = useCallback((p: PanelId) => { setPanel(p); setDrawer(null); }, []);
  const handleSend = useCallback((text: string) => { sendMessage(text); }, [sendMessage]);

  if (isLoading) return <div className="dz-loading">大周日暮录</div>;

  return (
    <NotificationCenter>
      <div className="dz-root">
        <div className="dz-body-row">
          <SideNav currentPage={page} onNavigate={(p) => { setPage(p); setPanel(null); setDrawer(null); }} onOpenPanel={openPanelWithAccordion} chatCount={chats.length} />

          <main className="dz-main">
            <StoryArea
              messages={activeChat?.messages || []}
              streamingText={streamingText}
              isStreaming={isSending}
              onOption={handleSend}
            />
            <CommandBar onSend={handleSend} onStop={cancelGeneration} isSending={isSending} chat={activeChat} />
          </main>

          <RightPanel
            chat={activeChat}
            openDrawer={drawer}
            onOpenDrawer={openDrawer}
            onOpenBag={() => openPanelWithAccordion('bag')}
            onOpenStorage={() => openPanelWithAccordion('storage')}
          />
        </div>

        {/* Overlay */}
        <div className={`dz-overlay ${panel ? 'on' : ''}`} onClick={closePanel} />

        {/* Panels (slide-up modals) */}
        <StatusModal isOpen={panel === 'status'} onClose={closePanel} />
        <ContactsModal isOpen={panel === 'contacts'} onClose={closePanel} />
        <BagModal isOpen={panel === 'bag'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />
        <NewsModal isOpen={panel === 'news'} onClose={closePanel} />
        <LeaderboardModal isOpen={panel === 'leaderboard'} onClose={closePanel} />
        <MapModal isOpen={panel === 'map'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />
        <StorageModal isOpen={panel === 'storage'} onClose={closePanel} onSend={(t) => { handleSend(t); closePanel(); }} />

        {/* Page modals */}
        {page === 'chats' && <ChatModal onClose={() => setPage('story')} />}
        {page === 'settings' && <SettingsModal onClose={() => setPage('story')} />}
      </div>
    </NotificationCenter>
  );
}

export default App;
