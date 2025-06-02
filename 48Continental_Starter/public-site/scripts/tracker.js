async function fetchRouteStatus() {
  const statusDiv = document.getElementById("route-status");
  try {
    const res = await fetch("https://your-worker-url.workers.dev");
    if (!res.ok) throw new Error("Failed to load status");
    const data = await res.json();
    statusDiv.innerHTML = `
      <p><strong>Current Stop:</strong> ${data.current || "TBD"}</p>
      <p><strong>Next Stop:</strong> ${data.next || "TBD"}</p>
      <p><strong>ETA:</strong> ${data.eta || "TBD"}</p>
    `;
  } catch (err) {
    statusDiv.innerHTML = "<p>Error loading route status. Please check back later.</p>";
  }
}
fetchRouteStatus();