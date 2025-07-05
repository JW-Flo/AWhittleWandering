import Foundation

public struct TripData: Codable, Identifiable {
    public let id: String
    public let tripId: String
    public let startDate: Date
    public let currentDay: Int
    public let statesVisited: [String]
    public let milesCompleted: Double
    public let milesRemaining: Double
    public let currentState: String
    
    public init(
        id: String = UUID().uuidString,
        tripId: String,
        startDate: Date,
        currentDay: Int,
        statesVisited: [String],
        milesCompleted: Double,
        milesRemaining: Double,
        currentState: String
    ) {
        self.id = id
        self.tripId = tripId
        self.startDate = startDate
        self.currentDay = currentDay
        self.statesVisited = statesVisited
        self.milesCompleted = milesCompleted
        self.milesRemaining = milesRemaining
        self.currentState = currentState
    }
}
