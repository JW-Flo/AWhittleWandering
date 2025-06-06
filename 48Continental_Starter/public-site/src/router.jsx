/**
 * The Wandering Whittle Router Configuration
 * 
 * Provides route configuration for the application,
 * including the main app and test/diagnostic pages.
 */

/* eslint-env browser */
import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import TestPage from './pages/TestPage';
import MapFixTestPage from './pages/MapFixTestPage';
import MapErrorTestPage from './pages/MapErrorTestPage';
import SimpleMapTestPage from './pages/SimpleMapTestPage';
import LiveVehicleMapTestPage from './pages/LiveVehicleMapTestPage';
import EnhancedVehicleMapTestPage from './pages/EnhancedVehicleMapTestPage';

// Define routes
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />
    },
    {
        path: '/test',
        element: <TestPage />
    },
    {
        path: '/map-fix-test',
        element: <MapFixTestPage />
    },
    {
        path: '/map-error-test',
        element: <MapErrorTestPage />
    },
    {
        path: '/simple-map-test',
        element: <SimpleMapTestPage />
    },
    {
        path: '/vehicle-tracker',
        element: <LiveVehicleMapTestPage />
    },
    {
        path: '/enhanced-vehicle-tracker',
        element: <EnhancedVehicleMapTestPage />
    }
]);

/**
 * Router Provider Component
 * Wrap this around the application in index.jsx
 */
const Router = () => {
    return <RouterProvider router={router} />;
};

export default Router;
