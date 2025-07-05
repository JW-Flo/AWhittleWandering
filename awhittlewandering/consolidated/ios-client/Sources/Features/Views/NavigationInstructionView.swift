import SwiftUI

public struct NavigationInstructionView: View {
    let instruction: String
    @State private var isExpanded = false
    
    public var body: some View {
        VStack(spacing: 0) {
            // Main Instruction Card
            Button(action: { withAnimation { isExpanded.toggle() } }) {
                HStack {
                    // Direction Icon
                    directionIcon
                    
                    // Instruction Text
                    Text(instruction)
                        .font(.headline)
                        .multilineTextAlignment(.leading)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    // Expand/Collapse Icon
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 2)
            }
            
            // Expanded Details
            if isExpanded {
                VStack(alignment: .leading, spacing: 12) {
                    // Distance to Next Turn
                    HStack {
                        Image(systemName: "arrow.right")
                        Text("In 0.5 miles")
                            .font(.subheadline)
                    }
                    
                    // Next Street Name
                    HStack {
                        Image(systemName: "signpost.right")
                        Text("Main Street")
                            .font(.subheadline)
                    }
                    
                    // Lane Guidance
                    laneGuidance
                }
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 2)
                .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
        .padding(.horizontal)
    }
    
    // MARK: - Components
    
    private var directionIcon: some View {
        Image(systemName: directionIconName)
            .font(.title2)
            .foregroundColor(.blue)
            .frame(width: 32, height: 32)
    }
    
    private var laneGuidance: some View {
        HStack(spacing: 4) {
            ForEach(0..<4) { index in
                VStack(spacing: 2) {
                    Image(systemName: "arrow.up")
                        .font(.caption)
                        .foregroundColor(index == 1 ? .blue : .secondary)
                    
                    RoundedRectangle(cornerRadius: 2)
                        .fill(index == 1 ? Color.blue : Color.secondary)
                        .frame(width: 4, height: 16)
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    // MARK: - Helper Properties
    
    private var directionIconName: String {
        if instruction.contains("right") {
            return "arrow.turn.up.right"
        } else if instruction.contains("left") {
            return "arrow.turn.up.left"
        } else if instruction.contains("U-turn") {
            return "arrow.uturn.left"
        } else {
            return "arrow.up"
        }
    }
}

// MARK: - Preview Provider

struct NavigationInstructionView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            NavigationInstructionView(instruction: "Turn right onto Main Street")
            
            NavigationInstructionView(instruction: "Continue straight for 2 miles")
                .preferredColorScheme(.dark)
        }
        .previewLayout(.sizeThatFits)
        .padding()
    }
}

// MARK: - Constants

private enum Constants {
    static let cardCornerRadius: CGFloat = 12
    static let shadowRadius: CGFloat = 2
    static let iconSize: CGFloat = 32
    static let standardPadding: CGFloat = 16
    static let animationDuration: Double = 0.3
}

// MARK: - Custom Modifiers

extension View {
    func navigationCardStyle() -> some View {
        self
            .padding()
            .background(Color(.systemBackground))
            .cornerRadius(Constants.cardCornerRadius)
            .shadow(radius: Constants.shadowRadius)
    }
}
