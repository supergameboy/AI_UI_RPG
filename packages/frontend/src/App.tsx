import { useGameStore } from './stores';
import { MainMenu, Settings } from './components/menu';
import { GameLayout } from './components/layout';
import { SaveManager } from './components/save';
import { Icon } from './components/common';
import './styles/global.css';

function App() {
  const { screen, showSettings, showSaveManager, notification } = useGameStore();

  return (
    <>
      {screen === 'menu' && <MainMenu />}
      {(screen === 'game' || screen === 'template-select') && <GameLayout />}
      {showSettings && <Settings />}
      
      {showSaveManager && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--spacing-lg)',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
          }}>
            <SaveManager
              mode="manage"
              onClose={() => useGameStore.getState().closeSaveManager()}
              onLoad={(save) => {
                useGameStore.getState().loadGame(save);
                useGameStore.getState().closeSaveManager();
              }}
            />
          </div>
        </div>
      )}

      {notification && (
        <div
          style={{
            position: 'fixed',
            bottom: 'var(--spacing-lg)',
            left: '50%',
            transform: 'translateX(-50%)',
            background: notification.type === 'success' ? 'var(--color-success)' : notification.type === 'error' ? 'var(--color-error)' : 'var(--color-primary)',
            color: 'white',
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1100,
          }}
        >
          <Icon 
            name={notification.type === 'success' ? 'success' : notification.type === 'error' ? 'error' : 'info'} 
            size={20} 
          />
          <span>{notification.message}</span>
        </div>
      )}
    </>
  );
}

export default App;
