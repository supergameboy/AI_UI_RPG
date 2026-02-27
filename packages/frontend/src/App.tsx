import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header className="app-header">
        <h1>AI-RPG Engine</h1>
        <p>AI驱动的通用角色扮演游戏引擎</p>
      </header>
      <main className="app-main">
        <div className="card">
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
          <p>
            编辑 <code>src/App.tsx</code> 并保存以测试 HMR
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
