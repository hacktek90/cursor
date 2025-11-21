// rightclick-block.js
(function () {
  const TARGET_URL = "https://hacktek90.github.io/accessblock/";

  // Preload iframe (hidden initially)
  const preloadedIframe = document.createElement("iframe");
  preloadedIframe.src = TARGET_URL;
  Object.assign(preloadedIframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
    display: "none",       // hidden until right-click
  });
  document.body.appendChild(preloadedIframe);

  // Create overlay function
  function showOverlay() {
    // avoid multiple overlays
    if (document.getElementById("access-overlay")) return;

    const overlay = document.createElement("div");
    overlay.id = "access-overlay";
    Object.assign(overlay.style, {
      position: "fixed",
      inset: "0",
      width: "100%",
      height: "100%",
      zIndex: 2147483647,
      background: "#000",       // optional dark background
      overflow: "hidden",
    });

    // --- NEW: Create Back Button ---
    const backBtn = document.createElement("button");
    backBtn.textContent = "Back";
    Object.assign(backBtn.style, {
      position: "absolute",
      top: "20px",
      left: "20px",
      zIndex: "2147483648",     // One level higher than overlay
      padding: "10px 20px",
      fontSize: "16px",
      fontFamily: "sans-serif",
      fontWeight: "bold",
      color: "#333",
      backgroundColor: "#fff",
      border: "1px solid #ccc",
      borderRadius: "8px",
      cursor: "pointer",
      boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
    });

    // Close functionality
    backBtn.onclick = function() {
      // 1. Hide iframe and move it back to body to preserve preload state
      preloadedIframe.style.display = "none";
      document.body.appendChild(preloadedIframe);
      
      // 2. Remove the overlay
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }

      // 3. Re-enable scrolling
      document.body.style.overflow = "";
    };
    // -------------------------------

    // Show preloaded iframe
    preloadedIframe.style.display = "block";
    
    // Append elements to overlay
    overlay.appendChild(preloadedIframe);
    overlay.appendChild(backBtn); // Append button last to sit on top
    
    document.body.appendChild(overlay);

    // Disable scrolling on body
    document.body.style.overflow = "hidden";
  }

  // Right-click / contextmenu
  document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    showOverlay();
  }, { passive: false });

  // Mobile long-press support
  (function enableLongPress() {
    let touchTimer = null;
    const threshold = 700;

    function touchStartHandler(e) {
      if (e.touches && e.touches.length > 1) return;
      touchTimer = setTimeout(showOverlay, threshold);
    }
    function touchEndHandler() {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    }

    document.addEventListener("touchstart", touchStartHandler, { passive: true });
    document.addEventListener("touchend", touchEndHandler);
    document.addEventListener("touchmove", touchEndHandler);
    document.addEventListener("touchcancel", touchEndHandler);
  })();
})();
