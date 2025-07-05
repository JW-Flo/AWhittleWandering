import Foundation

/// Production API Tokens
/// IMPORTANT: These tokens should be stored securely in production
/// using Keychain or similar secure storage
enum ProductionTokens {

    // MARK: - API Tokens

    /// Tessie API Token for Tesla Integration
    static let tessieToken = "bqfufwiCC5QeXIhlZ9I1eCYoF9XFd9xo"

    /// Mapbox Secret Token
    static let mapboxToken =
        "sk.eyJ1IjoiaGFyZHdvcmtjbyIsImEiOiJjbWJteGVzYTUxajlqMmtwenI5bHl1NDk4In0.3D0MbddcATKNja5NnvwYZQ"

    /// App Deploy Token
    static let appDeployToken = "lrka-qvsm-xrwo-yqkc"

    // MARK: - Tesla OAuth Credentials

    /// Tesla Client Configuration
    static let teslaConfig = TeslaOAuthConfig(
        clientId: "a78b7df7-5e4f-4ea4-91f4-d3963bcaf74e",
        clientSecret: "ta-secret.t4@VFJevq!il8gTM"
    )

    // MARK: - OAuth Settings

    /// OAuth Grant Types allowed
    static let oauthGrantTypes = ["client-credentials", "authorization-code"]

    /// Allowed Origins for OAuth
    static let allowedOrigins = [
        "https://laoi.48continental.com",
        "http://localhost:5173",
        "https://laoi.48continental.com/tesla/callback",
    ]

    // MARK: - Secure Storage

    /// Store tokens securely in Keychain
    static func secureTokens() {
        let keychain = KeychainAccess.Keychain(service: "com.48continental.usa")

        do {
            // Store tokens
            try keychain.set(tessieToken, key: "TESSIE_TOKEN")
            try keychain.set(mapboxToken, key: "MAPBOX_TOKEN")
            try keychain.set(appDeployToken, key: "APP_DEPLOY_TOKEN")

            // Store Tesla OAuth
            try keychain.set(teslaConfig.clientId, key: "TESLA_CLIENT_ID")
            try keychain.set(teslaConfig.clientSecret, key: "TESLA_CLIENT_SECRET")

            print("✅ Tokens stored securely in Keychain")
        } catch {
            print("❌ Failed to store tokens: \(error)")
        }
    }

    /// Retrieve tokens securely from Keychain
    static func getSecureToken(_ key: String) -> String? {
        let keychain = KeychainAccess.Keychain(service: "com.48continental.usa")
        return try? keychain.get(key)
    }
}

// MARK: - Supporting Types

struct TeslaOAuthConfig {
    let clientId: String
    let clientSecret: String
}

#if DEBUG
    extension ProductionTokens {
        /// Mock tokens for testing
        static let mockTokens = [
            "TESSIE_TOKEN": "mock_tessie_token",
            "MAPBOX_TOKEN": "mock_mapbox_token",
            "APP_DEPLOY_TOKEN": "mock_deploy_token",
            "TESLA_CLIENT_ID": "mock_tesla_client",
            "TESLA_CLIENT_SECRET": "mock_tesla_secret",
        ]
    }
#endif
