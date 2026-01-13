/*
 remotion_player.js
 Exposes window.startRemotionReplay(record) which mounts a Remotion <Player>
 that plays back the provided game move record via the composition exported
 from ./composition.jsx.
*/

import React from "react";
import { createRoot } from "react-dom/client";
import { Player } from "@websim/remotion/player";

// Keep a reference to the root so multiple calls replace the previous player.
let remotionRoot = null;

/**
 * Mount a Remotion Player into the #replayArea element.
 * record: array of {col, row, player}
 */
window.startRemotionReplay = async function startRemotionReplay(record = []) {
  const mount = document.getElementById("replayArea");
  if (!mount) return;

  // Clear any existing content
  mount.innerHTML = "";

  // Lazy import the composition to avoid loading remotion until needed.
  // composition.jsx should export MyComposition as a React component.
  let MyComposition = null;
  try {
    const mod = await import("./composition.jsx");
    MyComposition = mod.MyComposition || mod.default || null;
  } catch (err) {
    console.error("Failed to import composition.jsx:", err);
  }

  if (!MyComposition) {
    // Fallback: render a simple placeholder
    const el = document.createElement("div");
    el.style.padding = "12px";
    el.style.background = "#111";
    el.style.color = "#fff";
    el.style.borderRadius = "8px";
    el.textContent = "Replay composition not available.";
    mount.appendChild(el);
    return;
  }

  // Ensure there's a mounted React root
  if (remotionRoot) {
    // unmount previous root
    try { remotionRoot.unmount(); } catch (e) {}
    remotionRoot = null;
  }

  remotionRoot = createRoot(mount);

  // Decide duration: default 30 frames per move, minimum 60 frames total
  const fps = 30;
  const framesPerMove = 30;
  const durationInFrames = Math.max(60, (record.length || 0) * framesPerMove);

  remotionRoot.render(
    React.createElement(
      "div",
      { style: { width: "100%", height: "100%" } },
      React.createElement(Player, {
        component: MyComposition,
        durationInFrames,
        fps,
        // Portrait-friendly size; keep within the UI width
        compositionWidth: 540,
        compositionHeight: 960,
        loop: false,
        controls: true,
        autoplay: true,
        inputProps: { record, fps, framesPerMove },
        style: { width: "100%", height: "320px", maxWidth: "100%" },
      })
    )
  );
};