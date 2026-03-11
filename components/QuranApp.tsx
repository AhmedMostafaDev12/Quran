'use client';
import { useState, useEffect } from 'react';
import { Ayah, SurahDetail } from '@/types/quran';
import SurahList from './mushaf/SurahList';
import MushafReader from './mushaf/MushafReader';
import ChatPanel from './chat/ChatPanel';
import AthkarPage from './athkar/AthkarPage';

const MAIN_TABS = [
  { id: 'mushaf',  icon: '📖', label: 'المصحف' },
  { id: 'chat',    icon: '💬', label: 'الشات' },
  { id: 'athkar',  icon: '🤲', label: 'الأذكار' },
];

export default function QuranApp() {
  const [selectedVerse, setSelectedVerse] = useState<Ayah | null>(null);
  const [sadMode, setSadMode] = useState(false);
  const [currentSurah, setCurrentSurah] = useState<SurahDetail | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('mushaf');
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSurahList, setShowMobileSurahList] = useState(false);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const handleTafseerRequest = (ayah: Ayah) => {
    setSelectedVerse(ayah);
    if (isMobile) {
      setActiveMainTab('chat');
    }
  };

  const handleSurahSelect = (surah: SurahDetail) => {
    setCurrentSurah(surah);
    setShowMobileSurahList(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#0A0F1E] text-[#E8D5B0] relative overflow-hidden" dir="rtl">
      {/* Mobile Surah List Drawer */}
      {isMobile && (
        <div 
          className={`fixed inset-0 z-[100] transition-all duration-300 ${showMobileSurahList ? 'visible' : 'invisible'}`}
        >
          <div 
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${showMobileSurahList ? 'opacity-100' : 'opacity-0'}`}
            onClick={() => setShowMobileSurahList(false)}
          />
          <div 
            className={`absolute top-0 right-0 h-full w-[80%] max-w-[300px] bg-[#0A0F1E] border-l border-gold border-opacity-30 transform transition-transform duration-300 ease-out ${showMobileSurahList ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-gold border-opacity-20">
              <h3 className="text-xl font-bold text-gold-light">قائمة السور</h3>
              <button onClick={() => setShowMobileSurahList(false)} className="text-gold-light p-1">✕</button>
            </div>
            <div className="h-[calc(100%-60px)] overflow-y-auto">
              <SurahList onSelect={handleSurahSelect} current={currentSurah?.number} />
            </div>
          </div>
        </div>
      )}

      {/* Top Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {isMobile ? (
          /* MOBILE VIEW: Single Panel based on active tab */
          <div className="flex-1 w-full overflow-hidden flex flex-col">
            {activeMainTab === 'mushaf' && (
              <div className="flex-1 overflow-y-auto bg-[#FDF6E3]">
                <MushafReader
                  surah={currentSurah}
                  onVerseClick={handleTafseerRequest}
                  selectedVerse={selectedVerse}
                  onOpenSurahList={() => setShowMobileSurahList(true)}
                />
              </div>
            )}
            {activeMainTab === 'chat' && (
              <div className="flex-1 bg-[#0D1B2A] flex flex-col">
                <ChatPanel
                  selectedVerse={selectedVerse}
                  sadMode={sadMode}
                  onSadModeChange={setSadMode}
                />
              </div>
            )}
            {activeMainTab === 'athkar' && (
              <div className="flex-1 overflow-hidden">
                <AthkarPage />
              </div>
            )}
          </div>
        ) : (
          /* DESKTOP VIEW */
          <div className="flex w-full overflow-hidden">
            {activeMainTab === 'athkar' ? (
              /* If Athkar tab is selected on Desktop, show it full width */
              <div className="flex-1 overflow-hidden">
                <AthkarPage />
              </div>
            ) : (
              /* Default Side-by-Side view for Mushaf and Chat */
              <div className="flex w-full overflow-hidden">
                <div className="w-[250px] border-l border-gold border-opacity-30 hidden lg:block">
                  <SurahList onSelect={setCurrentSurah} current={currentSurah?.number} />
                </div>

                <div className="flex-[1.2] overflow-y-auto border-l border-gold border-opacity-30 bg-[#FDF6E3]">
                  <MushafReader
                    surah={currentSurah}
                    onVerseClick={handleTafseerRequest}
                    selectedVerse={selectedVerse}
                  />
                </div>

                <div className="flex-1 bg-[#0D1B2A] flex flex-col min-w-[350px]">
                  <ChatPanel
                    selectedVerse={selectedVerse}
                    sadMode={sadMode}
                    onSadModeChange={setSadMode}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom tab bar */}
      <div className="flex border-t border-gold border-opacity-15 bg-[#0D1B2A]" dir="rtl">
        {MAIN_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id)}
            className={`
              flex-1 py-3 flex flex-col items-center gap-1 text-[10px] sm:text-xs font-sans transition-all
              ${activeMainTab === tab.id || (activeMainTab === 'mushaf' && (tab.id === 'mushaf' || tab.id === 'chat')) ? 'text-gold-light' : 'text-muted'}
            `}
          >
            <span className="text-xl">{tab.icon}</span>
            {tab.label}
            {(activeMainTab === tab.id || (activeMainTab === 'mushaf' && !isMobile && (tab.id === 'mushaf' || tab.id === 'chat'))) && (
              <div className="w-1 h-1 rounded-full bg-gold" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
