import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './routes/HomePage';
import TripMapPage from './routes/TripMapPage';
import DailyLogPage from './routes/DailyLogPage';
import AboutPage from './routes/AboutPage';
import NotFoundPage from './routes/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="map" element={<TripMapPage />} />
        <Route path="daily-log">
          <Route index element={<DailyLogPage />} />
          <Route path=":day" element={<DailyLogPage />} />
        </Route>
        <Route path="about" element={<AboutPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
