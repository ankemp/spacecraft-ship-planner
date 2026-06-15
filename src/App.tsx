import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';

function App() {
  return (
    <div className="w-screen h-screen bg-[#050505] overflow-hidden" onContextMenu={(e) => e.preventDefault()}>
      <Scene />
      <Overlay />
    </div>
  );
}

export default App;
