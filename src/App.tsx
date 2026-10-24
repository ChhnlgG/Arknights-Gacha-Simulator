import { HashRouter, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { HistoryPage } from './pages/HistoryPage';

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/result" element={<ResultPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <footer className="border-t border-ark-border/50 py-6 mt-8">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <p className="text-xs text-gray-500 tracking-widest uppercase">
              Arknights Headhunt Simulator · 明日方舟寻访模拟器
            </p>
            <p className="text-[10px] text-gray-600 mt-1">
              本模拟器仅供学习娱乐 · 所有干员数据与立绘版权归 Hypergryph / 鹰角网络 所有
            </p>
          </div>
        </footer>
      </div>
    </HashRouter>
  );
}
