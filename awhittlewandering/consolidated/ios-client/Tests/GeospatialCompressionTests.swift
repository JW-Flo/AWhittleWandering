import XCTest
@testable import TeslaRoadTripTracker

class GeospatialCompressionTests: XCTestCase {
    // Sample test data
    let samplePoints = [
        TelemetryPoint(timestamp: 1625097600000, latitude: 37.7749, longitude: -122.4194),
        TelemetryPoint(timestamp: 1625097660000, latitude: 37.7746, longitude: -122.4189),
        TelemetryPoint(timestamp: 1625097720000, latitude: 37.7742, longitude: -122.4184),
        TelemetryPoint(timestamp: 1625097780000, latitude: 37.7737, longitude: -122.4179),
        TelemetryPoint(timestamp: 1625097840000, latitude: 37.7733, longitude: -122.4174)
    ]
    
    func testEncodeDecode() throws {
        // Test encoding
        let encoded = try GeospatialCompression.encodeTelemetry(samplePoints, tier: .nearLossless)
        XCTAssertNotNil(encoded)
        
        // Test decoding
        let decoded = try GeospatialCompression.decodeTelemetry(from: encoded)
        XCTAssertEqual(decoded.count, samplePoints.count)
        
        // Verify accuracy
        for (original, decoded) in zip(samplePoints, decoded) {
            let distance = calculateDistance(
                lat1: original.latitude, lon1: original.longitude,
                lat2: decoded.latitude, lon2: decoded.longitude
            )
            XCTAssertLessThan(distance, 5.0) // Within 5 meters
        }
    }
    
    func testCompressionTiers() throws {
        // Test each compression tier
        let tiers: [CompressionTier] = [.lossless, .nearLossless, .lossy]
        
        for tier in tiers {
            let encoded = try GeospatialCompression.encodeTelemetry(samplePoints, tier: tier)
            let decoded = try GeospatialCompression.decodeTelemetry(from: encoded)
            
            switch tier {
            case .lossless:
                // Lossless should preserve exact values
                XCTAssertEqual(decoded.count, samplePoints.count)
                for (original, decoded) in zip(samplePoints, decoded) {
                    XCTAssertEqual(original.latitude, decoded.latitude, accuracy: 0.0000001)
                    XCTAssertEqual(original.longitude, decoded.longitude, accuracy: 0.0000001)
                }
                
            case .nearLossless:
                // Near-lossless should be within 1 meter
                for (original, decoded) in zip(samplePoints, decoded) {
                    let distance = calculateDistance(
                        lat1: original.latitude, lon1: original.longitude,
                        lat2: decoded.latitude, lon2: decoded.longitude
                    )
                    XCTAssertLessThan(distance, 1.0)
                }
                
            case .lossy:
                // Lossy should be within 5 meters
                for (original, decoded) in zip(samplePoints, decoded) {
                    let distance = calculateDistance(
                        lat1: original.latitude, lon1: original.longitude,
                        lat2: decoded.latitude, lon2: decoded.longitude
                    )
                    XCTAssertLessThan(distance, 5.0)
                }
            }
        }
    }
    
    func testPerformance() throws {
        // Test encoding performance
        measure {
            XCTAssertNoThrow(try GeospatialCompression.encodeTelemetry(samplePoints, tier: .nearLossless))
        }
        
        let encoded = try GeospatialCompression.encodeTelemetry(samplePoints, tier: .nearLossless)
        
        // Test decoding performance
        measure {
            XCTAssertNoThrow(try GeospatialCompression.decodeTelemetry(from: encoded))
        }
    }
    
    func testErrorHandling() {
        // Test invalid data
        let invalidData = Data([0x00, 0x01, 0x02]) // Too short
        XCTAssertThrowsError(try GeospatialCompression.decodeTelemetry(from: invalidData))
        
        // Test empty points array
        XCTAssertThrowsError(try GeospatialCompression.encodeTelemetry([], tier: .lossless))
    }
    
    // Helper function to calculate distance between coordinates in meters
    private func calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double) -> Double {
        let R = 6371000.0 // Earth's radius in meters
        let φ1 = lat1 * .pi / 180
        let φ2 = lat2 * .pi / 180
        let Δφ = (lat2 - lat1) * .pi / 180
        let Δλ = (lon2 - lon1) * .pi / 180
        
        let a = sin(Δφ/2) * sin(Δφ/2) +
                cos(φ1) * cos(φ2) *
                sin(Δλ/2) * sin(Δλ/2)
        
        return R * 2 * atan2(sqrt(a), sqrt(1-a))
    }
}
