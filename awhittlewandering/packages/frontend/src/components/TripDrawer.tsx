import { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface DrawerProps {
  children: ReactNode;
}

/**
 * TripDrawer
 * DaisyUI “drawer” component that renders a left-hand sliding panel
 * with four tabs (Progress · Vehicle · States · Journey).
 * The drawer is responsive – collapses into a bottom sheet on sm screens.
 *
 * The open/close toggle is handled by an <input type="checkbox"> per
 * DaisyUI convention; pressing the chevron hides the panel.
 *
 * Usage:
 *   <TripDrawer>
 *     <EnhancedTripMap />
 *   </TripDrawer>
 */
export default function TripDrawer({ children }: DrawerProps) {
  return (
    <div className="drawer lg:drawer-open h-screen w-screen overflow-hidden bg-base-300 text-base-content">
      {/* Drawer toggle (checkbox hack) */}
      <input id="drawer-toggle" type="checkbox" className="drawer-toggle" />

      {/* Main content */}
      <div className="drawer-content flex flex-col relative">
        {/* Floating toggle button visible on large screens */}
        <label
          htmlFor="drawer-toggle"
          className="btn btn-circle btn-sm bg-base-100 border-base-200 hover:bg-base-200 shadow absolute left-2 top-2 lg:hidden z-20"
          aria-label="Open navigation drawer"
        >
          ☰
        </label>
        {children}
      </div>

      {/* Sidebar panel */}
      <div className="drawer-side z-30">
        <label htmlFor="drawer-toggle" className="drawer-overlay"></label>

        <aside className="menu p-4 w-80 min-h-full bg-base-100 text-base-content border-r border-base-200">
          {/* Branding */}
          <h2 className="text-xl font-bold mb-4">The Wandering Whittle</h2>

          {/* Tabs */}
          <div role="tablist" className="tabs tabs-bordered mb-4">
            <a href="#progress" role="tab" className="tab tab-active">
              Progress
            </a>
            <a href="#vehicle" role="tab" className="tab">
              Vehicle
            </a>
            <a href="#states" role="tab" className="tab">
              States
            </a>
            <a href="#journey" role="tab" className="tab">
              Journey
            </a>
          </div>

          {/* Drawer body – minimal for now, will be populated later */}
          <div className="h-[calc(100vh_-_180px)] overflow-y-auto pr-1">
            <section id="progress" className="space-y-3">
              <h3 className="font-semibold">Trip Progress</h3>
              <div className="stats shadow">
                <div className="stat">
                  <div className="stat-title">States Visited</div>
                  <div className="stat-value">11 / 48</div>
                </div>
              </div>
              {/* TODO: inject dynamic DaisyUI progress components */}
            </section>

            <section id="vehicle" className="pt-6">
              <h3 className="font-semibold mb-2">Vehicle Telemetry</h3>
              {/* Populated via Radix popovers / live data */}
              <p className="text-sm opacity-70">Live data coming…</p>
            </section>

            <section id="states" className="pt-6">
              <h3 className="font-semibold mb-2">Visited States</h3>
              {/* TODO */}
            </section>

            <section id="journey" className="pt-6">
              <h3 className="font-semibold mb-2">Upcoming Stops</h3>
              {/* TODO */}
            </section>
          </div>

          {/* Hide button for lg+ sizes */}
          <label
            className="btn btn-square btn-xs absolute -right-3 top-1/2 hidden lg:inline-flex rotate-180 translate-y-[-50%]"
            aria-label="Hide drawer"
            className="btn btn-square btn-xs absolute -right-3 top-1/2 hidden lg:inline-flex rotate-180 translate-y-[-50%]"
          >
            ❯
          </label>
        </aside>
      </div>
    </div>
  );
}
