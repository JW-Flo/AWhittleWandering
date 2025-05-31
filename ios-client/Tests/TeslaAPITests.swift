import MCPClient  // Ensure the correct module is imported
import XCTest

final class TeslaAPITests: XCTestCase {

    func testAuthentication() {
        let teslaAPI = TeslaAPI()
        let expectation = self.expectation(description: "Authentication should succeed")

        teslaAPI.authenticate(username: "test@example.com", password: "password123") {
            success, error in
            XCTAssertTrue(success == true, "Authentication failed")  // Ensure success is treated as Bool
            XCTAssertNil(error, "Error should be nil")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }

    func testNavigationRequest() {
        let teslaAPI = TeslaAPI()
        let expectation = self.expectation(description: "Navigation request should succeed")

        teslaAPI.navigateTo(latitude: 37.7749, longitude: -122.4194) { success, error in
            XCTAssertTrue(success == true, "Navigation request failed")  // Ensure success is treated as Bool
            XCTAssertNil(error, "Error should be nil")
            expectation.fulfill()
        }

        waitForExpectations(timeout: 5, handler: nil)
    }
}
