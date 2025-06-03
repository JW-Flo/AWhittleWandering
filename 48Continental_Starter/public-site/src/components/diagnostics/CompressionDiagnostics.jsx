import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { COMPRESSION_TIERS, encodeTelemetry, decodeTelemetry } from '../../../../edge-worker/src/telemetryCompression';

const CompressionDiagnostics = ({ telemetryData }) => {
  const [stats, setStats] = useState(null);
  const [compressedRoute, setCompressedRoute] = useState(null);
  const [selectedTier, setSelectedTier] = useState(COMPRESSION_TIERS.NEAR_LOSSLESS);

  useEffect(() => {
    if (!telemetryData) return;

    const startEncode = performance.now();
    const compressed = encodeTelemetry(telemetryData, selectedTier);
    const encodeTime = performance.now() - startEncode;

    const startDecode = performance.now();
    const decompressed = decodeTelemetry(compressed);
    const decodeTime = performance.now() - startDecode;

    const compressionRatio = 1 - (compressed.metadata.compressedSize / compressed.metadata.originalSize);

    setStats({
      originalPoints: telemetryData.length,
      compressedPoints: decompressed.length,
      compressionRatio,
      encodeTime,
      decodeTime
    });

    setCompressedRoute(decompressed);
  }, [telemetryData, selectedTier]);

  if (!stats || !compressedRoute) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-r from-blue-600 to-blue-800">
          <div className="absolute inset-0 bg-black opacity-50" />
          <div className="relative px-8 py-12">
            <h1 className="text-4xl font-bold text-white">
              Telemetry Compression Diagnostics
            </h1>
            <p className="mt-2 text-blue-100">
              Real-time compression analysis and visualization
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
          <StatCard
            title="Compression Ratio"
            value={`${(stats.compressionRatio * 100).toFixed(1)}%`}
            icon="chart-pie"
          />
          <StatCard
            title="Processing Times"
            value={`${stats.encodeTime.toFixed(2)}ms / ${stats.decodeTime.toFixed(2)}ms`}
            subtext="Encode / Decode"
            icon="clock"
          />
          <StatCard
            title="Data Points"
            value={`${stats.compressedPoints} / ${stats.originalPoints}`}
            subtext="Compressed / Original"
            icon="map-marker"
          />
        </div>

        {/* Compression Controls */}
        <div className="px-8 pb-6">
          <label className="block text-sm font-medium text-gray-700">
            Compression Tier
          </label>
          <select
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={selectedTier}
            onChange={(e) => setSelectedTier(Number(e.target.value))}
          >
            <option value={COMPRESSION_TIERS.LOSSLESS}>Tier 1 - Lossless</option>
            <option value={COMPRESSION_TIERS.NEAR_LOSSLESS}>Tier 2 - Near Lossless</option>
            <option value={COMPRESSION_TIERS.LOSSY}>Tier 3 - Lossy</option>
          </select>
        </div>

        {/* Map Comparison */}
        <div className="px-8 pb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Route Comparison
          </h2>
          <div className="h-96 bg-gray-100 rounded-lg overflow-hidden">
            <MapContainer
              center={[39.8283, -98.5795]}
              zoom={4}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* Original Route */}
              <Polyline
                positions={telemetryData.map(p => [p.latitude, p.longitude])}
                color="red"
                opacity={0.6}
              />
              {/* Compressed Route */}
              <Polyline
                positions={compressedRoute.map(p => [p.latitude, p.longitude])}
                color="blue"
                opacity={0.8}
              />
            </MapContainer>
          </div>
          <div className="mt-4 flex items-center justify-center space-x-8">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 opacity-60 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Original Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 opacity-80 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Compressed Route</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, subtext, icon }) => (
  <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <i className={`fas fa-${icon} text-2xl text-blue-600`}></i>
      </div>
      <div className="ml-5">
        <dl>
          <dt className="text-sm font-medium text-gray-500 truncate">
            {title}
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {value}
          </dd>
          {subtext && (
            <dd className="mt-1 text-sm text-gray-500">
              {subtext}
            </dd>
          )}
        </dl>
      </div>
    </div>
  </div>
);

export default CompressionDiagnostics;
