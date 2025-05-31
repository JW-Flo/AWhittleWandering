import Foundation
import CoreLocation
public final class AppState: NSObject, ObservableObject, CLLocationManagerDelegate {
  private let mgr = CLLocationManager()
  public override init() { super.init(); mgr.delegate = self; mgr.requestAlwaysAuthorization(); mgr.startMonitoringVisits() }
  public func locationManager(_ m: CLLocationManager, didVisit v: CLVisit) { print("Visit \(v.coordinate)") }
}
