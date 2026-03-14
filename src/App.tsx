import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainApp from './pages/MainApp';
import Laporan from './pages/Laporan';
import { AppProvider } from './context/AppContext';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/laporan" element={<Laporan />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
