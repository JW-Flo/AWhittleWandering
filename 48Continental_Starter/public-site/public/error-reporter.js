// Error reporting for debugging deployment issues
window.addEventListener("error", (e) => {
  console.error("Global error caught:", {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    colno: e.colno,
    error: e.error?.stack,
  });

  // Send to a simple logging endpoint or display prominently
  if (typeof document !== "undefined" && document.body) {
    let errorDiv = document.getElementById("global-error-reporter");
    if (!errorDiv) {
      errorDiv = document.createElement("div");
      errorDiv.id = "global-error-reporter";
      errorDiv.style.cssText = `
        position: fixed; 
        top: 0; 
        left: 0; 
        right: 0; 
        background: red; 
        color: white; 
        padding: 10px; 
        z-index: 10000; 
        font-family: monospace;
      `;
      document.body.appendChild(errorDiv);
    }
    errorDiv.innerHTML = `ERROR: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`;
  }
    errorDiv.innerHTML = `ERROR: ${e.message} at ${e.filename}:${e.lineno}:${e.colno}`;
    document.body.appendChild(errorDiv);
  }
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

console.log("Error reporting initialized");
