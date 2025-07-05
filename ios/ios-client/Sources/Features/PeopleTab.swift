import SwiftUI

@available(macOS 11.0, *)
struct PeopleTabView: View {
    @State private var anchorStops: [AnchorStop] = [
        AnchorStop(name: "Troy", date: Date().addingTimeInterval(3600 * 24 * 3)),
        AnchorStop(name: "Alex", date: Date().addingTimeInterval(3600 * 24 * 7)),
    ]

    var body: some View {
        NavigationView {
            List(anchorStops) { stop in
                VStack(alignment: .leading) {
                    Text(stop.name)
                        .font(.headline)
                    Text("ETA: \(formattedDate(stop.date))")
                        .font(.subheadline)
                        .foregroundColor(.gray)
                }
            }
            .navigationTitle("People")
        }
    }

    private func formattedDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct AnchorStop: Identifiable {
    let id = UUID()
    let name: String
    let date: Date
}

@available(macOS 11.0, *)
struct PeopleTabView_Previews: PreviewProvider {
    static var previews: some View {
        if #available(macOS 11.0, *) {
            PeopleTabView()
        } else {
            Text("Not available on this macOS version")
        }
    }
}
