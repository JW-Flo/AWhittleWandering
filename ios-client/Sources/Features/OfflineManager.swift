import Combine
import Foundation

class OfflineManager: ObservableObject {
    static let shared = OfflineManager()

    @Published private(set) var visitQueue: [[String: Any]] = []
    @Published private(set) var socQueue: [[String: Any]] = []

    private let maxQueueSize = 25 * 1024 * 1024  // 25 MB

    private init() {}

    func cacheVisit(_ visit: [String: Any]) {
        visitQueue.append(visit)
        enforceQueueLimit()
    }

    func cacheSoC(_ soc: [String: Any]) {
        socQueue.append(soc)
        enforceQueueLimit()
    }

    func flushQueues() {
        guard !visitQueue.isEmpty || !socQueue.isEmpty else { return }

        // Placeholder for upload logic
        print("Flushing visit queue: \(visitQueue.count) items")
        print("Flushing SoC queue: \(socQueue.count) items")

        visitQueue.removeAll()
        socQueue.removeAll()
    }

    private func enforceQueueLimit() {
        let totalSize =
            visitQueue.reduce(0) { $0 + ($1.description.count) }
            + socQueue.reduce(0) { $0 + ($1.description.count) }

        if totalSize > maxQueueSize {
            print("Queue size exceeded limit. Dropping oldest items.")
            while visitQueue.count > 0 && totalSize > maxQueueSize {
                visitQueue.removeFirst()
            }
            while socQueue.count > 0 && totalSize > maxQueueSize {
                socQueue.removeFirst()
            }
        }
    }
}
