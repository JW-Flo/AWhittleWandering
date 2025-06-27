import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './routes/HomePage';
import TripMapPage from './routes/TripMapPage';
import DailyLogPage from './routes/DailyLogPage';
import AboutPage from './routes/AboutPage';
import NotFoundPage from './routes/NotFoundPage';
export default function App() {
    return (_jsx(Routes, { children: _jsxs(Route, { path: "/", element: _jsx(Layout, {}), children: [_jsx(Route, { index: true, element: _jsx(HomePage, {}) }), _jsx(Route, { path: "map", element: _jsx(TripMapPage, {}) }), _jsxs(Route, { path: "daily-log", children: [_jsx(Route, { index: true, element: _jsx(DailyLogPage, {}) }), _jsx(Route, { path: ":day", element: _jsx(DailyLogPage, {}) })] }), _jsx(Route, { path: "about", element: _jsx(AboutPage, {}) }), _jsx(Route, { path: "*", element: _jsx(NotFoundPage, {}) })] }) }));
}
