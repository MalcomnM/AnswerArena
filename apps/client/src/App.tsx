import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { BoardPage } from './pages/BoardPage';
import { HostPage } from './pages/HostPage';
import { PlayPage } from './pages/PlayPage';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/board" element={<BoardPage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/play" element={<PlayPage />} />
        <Route path="*" element={<Navigate to="/play" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
