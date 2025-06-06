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

// Define routes
const router = createBrowserRouter([
    {
        path: '/',
        element: <App />
    },
    {
        path: '/test',
        element: <TestPage />
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
