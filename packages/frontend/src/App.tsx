import { useGameStore } from './stores';
import { MainMenu, Settings } from './components/menu';
import { GameLayout } from './components/layout';
import './styles/global.css';

function App() {
  const { screen, showSettings } = useGameStore();

  return (
    <>
      {screen === 'menu' && <MainMenu />}
      {(screen === 'game' || screen === 'template-select') && <GameLayout />}
      {showSettings && <Settings />}
    </>
  );
}

export default App;
