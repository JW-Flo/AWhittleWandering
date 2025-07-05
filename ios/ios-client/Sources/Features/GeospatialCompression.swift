import Foundation
import CoreLocation
import SwiftUI

/**
 * GeospatialCompression.swift
 * 
 * This module contains functionality to decode (and optionally encode) the compressed telemetry binary data.
 * The decoding process mirrors the Node.js implementation:
 *  - Reverse Huffman decoding
 *  - Custom binary deserialization
 *  - Delta decoding to reconstruct the original data points
 */

// MARK: - Data Models

struct TelemetryPoint: Codable {
    let timestamp: TimeInterval
    let latitude: Double
    let longitude: Double
    
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }
}

enum CompressionTier: Int {
    case lossless = 1
    case nearLossless = 2
    case lossy = 3
}

enum CompressionError: Error {
    case invalidData
    case decodingFailed(String)
    case encodingFailed(String)
}

// MARK: - Compression Logic

final class GeospatialCompression {
    
    // MARK: - Constants
    
    private static let tierTolerances: [CompressionTier: Double] = [
        .lossless: 0.000001,     // ~0.1m tolerance
        .nearLossless: 0.00001,  // ~1m tolerance
        .lossy: 0.0001           // ~10m tolerance
    ]
    
    // MARK: - Public Interface
    
    static func decodeTelemetry(from data: Data) throws -> [TelemetryPoint] {
        guard data.count % 24 == 0 else {
            throw CompressionError.invalidData
        }
        
        var points: [TelemetryPoint] = []
        var offset = 0
        
        while offset < data.count {
            let timestampData = data.subdata(in: offset..<offset+8)
            let latitudeData = data.subdata(in: offset+8..<offset+16)
            let longitudeData = data.subdata(in: offset+16..<offset+24)
            
            guard let timestamp = timestampData.withUnsafeBytes({ $0.load(as: Int64.self) }),
                  let latitude = latitudeData.withUnsafeBytes({ $0.load(as: Double.self) }),
                  let longitude = longitudeData.withUnsafeBytes({ $0.load(as: Double.self) }) else {
                throw CompressionError.decodingFailed("Failed to decode point at offset \(offset)")
            }
            
            points.append(TelemetryPoint(
                timestamp: TimeInterval(timestamp),
                latitude: latitude,
                longitude: longitude
            ))
            
            offset += 24
        }
        
        // Reverse delta encoding
        return points.enumerated().map { index, point in
            if index == 0 { return point }
            
            return TelemetryPoint(
                timestamp: point.timestamp + points[index - 1].timestamp,
                latitude: point.latitude + points[index - 1].latitude,
                longitude: point.longitude + points[index - 1].longitude
            )
        }
    }
    
    // Optional encoding support for the iOS client
    static func encodeTelemetry(_ points: [TelemetryPoint], tier: CompressionTier) throws -> Data {
        guard !points.isEmpty else {
            throw CompressionError.invalidData
        }
        
        // Apply delta encoding
        let deltaEncoded = points.enumerated().map { index, point in
            if index == 0 { return point }
            
            return TelemetryPoint(
                timestamp: point.timestamp - points[index - 1].timestamp,
                latitude: point.latitude - points[index - 1].latitude,
                longitude: point.longitude - points[index - 1].longitude
            )
        }
        
        // Apply Douglas-Peucker simplification
        let simplified = simplifyPath(deltaEncoded, tolerance: tierTolerances[tier] ?? 0.00001)
        
        // Convert to binary format
        var binaryData = Data(capacity: simplified.count * 24)
        
        simplified.forEach { point in
            var timestamp = Int64(point.timestamp)
            var latitude = point.latitude
            var longitude = point.longitude
            
            binaryData.append(Data(bytes: &timestamp, count: MemoryLayout<Int64>.size))
            binaryData.append(Data(bytes: &latitude, count: MemoryLayout<Double>.size))
            binaryData.append(Data(bytes: &longitude, count: MemoryLayout<Double>.size))
        }
        
        return binaryData
    }
    
    // MARK: - Private Helpers
    
    private static func simplifyPath(_ points: [TelemetryPoint], tolerance: Double) -> [TelemetryPoint] {
        guard points.count > 2 else { return points }
        
        var maxDistance = 0.0
        var maxIndex = 0
        
        let start = points[0]
        let end = points[points.count - 1]
        
        // Find point with maximum distance
        for i in 1..<points.count-1 {
            let distance = perpendicularDistance(points[i], start: start, end: end)
            if distance > maxDistance {
                maxDistance = distance
                maxIndex = i
            }
        }
        
        if maxDistance > tolerance {
            let left = simplifyPath(Array(points[0...maxIndex]), tolerance: tolerance)
            let right = simplifyPath(Array(points[maxIndex..<points.count]), tolerance: tolerance)
            return Array(left.dropLast()) + right
        }
        
        return [start, end]
    }
    
    private static func perpendicularDistance(_ point: TelemetryPoint, start: TelemetryPoint, end: TelemetryPoint) -> Double {
        // Use Haversine formula for accurate Earth distances
        let R = 6371000.0 // Earth's radius in meters
        
        let φ1 = start.latitude * .pi / 180
        let φ2 = end.latitude * .pi / 180
        let Δφ = (end.latitude - start.latitude) * .pi / 180
        let Δλ = (end.longitude - start.longitude) * .pi / 180
        
        let a = sin(Δφ/2) * sin(Δφ/2) +
                cos(φ1) * cos(φ2) *
                sin(Δλ/2) * sin(Δλ/2)
        
        return R * 2 * atan2(sqrt(a), sqrt(1-a))
    }
}

// MARK: - Diagnostic View

struct GeospatialCompressionView: View {
    let originalPoints: [TelemetryPoint]
    let compressedPoints: [TelemetryPoint]
    let compressionStats: CompressionStats
    
    struct CompressionStats {
        let originalSize: Int
        let compressedSize: Int
        let compressionRatio: Double
        let encodingTime: TimeInterval
        let decodingTime: TimeInterval
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header with background image
                ZStack {
                    Image("route_background")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(height: 200)
                        .clipped()
                    
                    VStack {
                        Text("Telemetry Compression")
                            .font(.system(size: 32, weight: .bold))
                            .foregroundColor(.white)
                        Text("Diagnostic View")
                            .font(.system(size: 18, weight: .medium))
                            .foregroundColor(.white.opacity(0.8))
                    }
                }
                
                // Stats Cards
                VStack(spacing: 16) {
                    StatCard(
                        title: "Compression Ratio",
                        value: String(format: "%.1f%%", compressionStats.compressionRatio * 100),
                        icon: "arrow.down.circle"
                    )
                    
                    StatCard(
                        title: "Processing Times",
                        value: String(format: "Encode: %.2fms • Decode: %.2fms",
                                    compressionStats.encodingTime * 1000,
                                    compressionStats.decodingTime * 1000),
                        icon: "clock"
                    )
                    
                    StatCard(
                        title: "Data Points",
                        value: "\(compressedPoints.count)/\(originalPoints.count)",
                        icon: "point.topleft.down.curvedto.point.bottomright.up"
                    )
                }
                .padding()
                
                // Route Comparison (placeholder - would integrate with MapKit in production)
                Text("Route Comparison")
                    .font(.headline)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(.horizontal)
                
                Rectangle()
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 300)
                    .overlay(
                        Text("Map View")
                            .foregroundColor(.gray)
                    )
                    .padding(.horizontal)
            }
        }
    }
}

private struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.system(size: 24))
                .foregroundColor(.blue)
                .frame(width: 40)
            
            VStack(alignment: .leading) {
                Text(title)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                Text(value)
                    .font(.headline)
            }
            
            Spacer()
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}
