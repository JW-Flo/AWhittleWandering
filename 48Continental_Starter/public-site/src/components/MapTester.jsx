/* eslint-env browser */
import React, { useState } from 'react';
import MinimalMapTest from './MinimalMapTest';
import './MapTester.css';

import { ensureMapboxFormat } from "../utils/mapUtils";

/**
 * MapTester component for debugging map issues
 */
const MapTester = () => {
    const [expanded, setExpanded] = useState(false);
    const [showMinimal, setShowMinimal] = useState(false);
    const [tokenInfo, setTokenInfo] = useState(null);
    const [errorLog, setErrorLog] = useState([]);

    // Check MapBox token
    const verifyMapboxToken = () => {
        try {
            const token = import.meta.env.VITE_MAPBOX_TOKEN ||
                document.querySelector('meta[name="mapbox-token"]')?.content ||
                'pk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJmNXlwY2IycGdtMnFva2liaTA4enIwIn0.tU9_tLaaxXxhfcVX4WhOeA';

            const tokenStart = token.substring(0, 10);
            const tokenType = token.startsWith('pk.') ? 'Public' :
                token.startsWith('sk.') ? 'Secret (WARNING!)' : 'Unknown';

            setTokenInfo({
                token: tokenStart + '...',
                type: tokenType,
                full: token,
                meta: !!document.querySelector('meta[name="mapbox-token"]'),
                env: !!import.meta.env.VITE_MAPBOX_TOKEN
            });

            // Log token info to console to help with debugging
            console.log('MapTester: MapBox token info:', {
                start: tokenStart + '...',
                type: tokenType,
                fromMeta: !!document.querySelector('meta[name="mapbox-token"]'),
                fromEnv: !!import.meta.env.VITE_MAPBOX_TOKEN
            });
        } catch (error) {
            console.error('Error verifying token:', error);
            setErrorLog(prev => [...prev, `Token verification error: ${error.message}`]);
        }
    };

    // Toggle minimal map
    const toggleMinimalMap = () => {
        setShowMinimal(!showMinimal);
    };

    return (
        <div className={`map-tester ${expanded ? 'expanded' : 'collapsed'}`}>
            <div className="map-tester-header" onClick={() => setExpanded(!expanded)}>
                <span>🔍 Map Diagnostics</span>
                <button className="expand-button">{expanded ? '▼' : '▲'}</button>
            </div>

            {expanded && (
                <div className="map-tester-content">
                    <div className="actions">
                        <button onClick={verifyMapboxToken}>Check MapBox Token</button>
                        <button onClick={toggleMinimalMap}>
                            {showMinimal ? 'Hide Test Map' : 'Show Test Map'}
                        </button>
                    </div>

                    {tokenInfo && (
                        <div className="token-info">
                            <h4>MapBox Token Info</h4>
                            <div className="info-row">
                                <span>Token: </span>
                                <span>{tokenInfo.token}</span>
                            </div>
                            <div className="info-row">
                                <span>Type: </span>
                                <span>{tokenInfo.type}</span>
                            </div>
                            <div className="info-row">
                                <span>In Meta Tag: </span>
                                <span>{tokenInfo.meta ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="info-row">
                                <span>In .env: </span>
                                <span>{tokenInfo.env ? 'Yes' : 'No'}</span>
                            </div>
                            <button
                                className="copy-button"
                                onClick={() => {
                                    navigator.clipboard.writeText(tokenInfo.full);
                                    alert('Token copied to clipboard!');
                                }}
                            >
                                Copy Full Token
                            </button>
                        </div>
                    )}

                    {errorLog.length > 0 && (
                        <div className="error-log">
                            <h4>Error Log</h4>
                            <ul>
                                {errorLog.map((error, index) => (
                                    <li key={index}>{error}</li>
                                ))}
                            </ul>
                            <button onClick={() => setErrorLog([])}>Clear Log</button>
                        </div>
                    )}

                    {showMinimal && (
                        <div className="minimal-map-container">
                            <h4>Minimal Test Map</h4>
                            <MinimalMapTest />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MapTester;
