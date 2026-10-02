import React, { useState, useEffect } from 'react';
import { Header } from './ui/components/Header';
import { Sidebar, PageId } from './ui/components/Sidebar';
import { FloatingRecordingWidget } from './ui/components/FloatingRecordingWidget';
import { OnboardingWizard } from './ui/components/OnboardingWizard';
import { TestRunnerModal } from './ui/components/TestRunnerModal';

// Pages
import { HomePage } from './ui/pages/HomePage';
import { DictationPage } from './ui/pages/DictationPage';
import { ProvidersPage } from './ui/pages/ProvidersPage';
import { DictionaryPage } from './ui/pages/DictionaryPage';
import { SnippetsPage } from './ui/pages/SnippetsPage';
import { StylesPage } from './ui/pages/StylesPage';
import { ShortcutsPage } from './ui/pages/ShortcutsPage';
import { AudioPage } from './ui/pages/AudioPage';
import { ContextPage } from './ui/pages/ContextPage';
import { PrivacyPage } from './ui/pages/PrivacyPage';
import { AdvancedPage } from './ui/pages/AdvancedPage';
import { DiagnosticsPage } from './ui/pages/DiagnosticsPage';
import { AboutPage } from './ui/pages/AboutPage';

// Services
import { dictationService, DictationSnapshot } from './core/dictation/DictationService';
import { contextService } from './core/context/ContextService';
import { shortcutService } from './core/shortcuts/ShortcutService';
import { storageService } from './core/storage/StorageService';
import { ActiveAppContext, TranscriptRecord } from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('home');
  const [snapshot, setSnapshot] = useState<DictationSnapshot>(() => dictationService.getSnapshot());
  const [activeContext, setActiveContext] = useState<ActiveAppContext>(() => contextService.getCurrentContext());
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>(() => storageService.getTranscripts());
  const [isFirstRun, setIsFirstRun] = useState<boolean>(() => !storageService.isFirstRunCompleted());
  const [showTestModal, setShowTestModal] = useState<boolean>(false);

  // Subscribe to Dictation State
  useEffect(() => {
    const unsubDictation = dictationService.subscribe((newSnapshot) => {
      setSnapshot(newSnapshot);
      if (newSnapshot.state === 'COMPLETED') {
        setTranscripts(storageService.getTranscripts());
      }
    });

    const unsubContext = contextService.subscribe((newContext) => {
      setActiveContext(newContext);
    });

    // Register global hotkey handlers
    shortcutService.register({
      onToggleDictation: () => {
        dictationService.toggleDictation();
      },
      onStartRecording: () => {
        dictationService.startDictation();
      },
      onStopRecording: () => {
        dictationService.stopAndProcess();
      },
      onCancel: () => {
        dictationService.cancel();
      },
      onToggleDeveloperMode: () => {
        dictationService.toggleDeveloperMode();
      }
    });

    return () => {
      unsubDictation();
      unsubContext();
      shortcutService.unregister();
    };
  }, []);

  const activeProvider = storageService.getProviders().activeProvider;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* First-Run Onboarding Wizard */}
      {isFirstRun && (
        <OnboardingWizard onComplete={() => setIsFirstRun(false)} />
      )}

      {/* Automated Unit Test Modal */}
      <TestRunnerModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
      />

      {/* Floating HUD Widget */}
      <FloatingRecordingWidget
        snapshot={snapshot}
        onStop={() => dictationService.stopAndProcess()}
        onCancel={() => dictationService.cancel()}
        onToggle={() => dictationService.toggleDictation()}
      />

      {/* Application Shell */}
      <div className="flex flex-col flex-1 h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          snapshot={snapshot}
          activeContext={activeContext}
          activeProvider={activeProvider}
          onToggleDictation={() => dictationService.toggleDictation()}
          onRunTestSuite={() => setShowTestModal(true)}
        />

        {/* Workspace Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* 13-Page Sidebar */}
          <Sidebar
            currentPage={currentPage}
            onSelectPage={(page) => setCurrentPage(page)}
            dictationActive={snapshot.state === 'RECORDING'}
            historyCount={transcripts.length}
          />

          {/* Main Viewport Content */}
          <main className="flex-1 overflow-y-auto bg-slate-950/90 text-slate-100">
            {currentPage === 'home' && (
              <HomePage
                snapshot={snapshot}
                activeContext={activeContext}
                activeProvider={activeProvider}
                transcripts={transcripts}
                onToggleDictation={() => dictationService.toggleDictation()}
                onNavigate={(page) => setCurrentPage(page)}
              />
            )}

            {currentPage === 'dictation' && (
              <DictationPage
                snapshot={snapshot}
                onToggleDictation={() => dictationService.toggleDictation()}
                onCancel={() => dictationService.cancel()}
                onToggleDevMode={() => dictationService.toggleDeveloperMode()}
              />
            )}

            {currentPage === 'providers' && (
              <ProvidersPage />
            )}

            {currentPage === 'dictionary' && (
              <DictionaryPage />
            )}

            {currentPage === 'snippets' && (
              <SnippetsPage />
            )}

            {currentPage === 'styles' && (
              <StylesPage />
            )}

            {currentPage === 'shortcuts' && (
              <ShortcutsPage />
            )}

            {currentPage === 'audio' && (
              <AudioPage />
            )}

            {currentPage === 'context' && (
              <ContextPage activeContext={activeContext} />
            )}

            {currentPage === 'privacy' && (
              <PrivacyPage />
            )}

            {currentPage === 'advanced' && (
              <AdvancedPage />
            )}

            {currentPage === 'logs' && (
              <DiagnosticsPage activeContext={activeContext} />
            )}

            {currentPage === 'about' && (
              <AboutPage />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
