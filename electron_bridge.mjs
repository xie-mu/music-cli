/**
 * nm Player Bridge ? sends orpheus protocol URL to desktop client
 *
 * The CORRECT orpheus URL format (reverse-engineered from web player):
 *   orpheus://base64({"type":"song","id":"<songId>","cmd":"play","channel":"webset"})
 *
 * Earlier assumptions (orpheus://song/{id}) were WRONG.
 * The desktop app expects base64-encoded JSON, not a path-based URL.
 */
import { spawn } from "node:child_process";
import { platform } from "node:os";

let currentStatus = { type: "idle", state: "idle" };

function buildOrpheusUrl(songId) {
  const payload = { type: "song", id: String(songId), cmd: "play", channel: "webset" };
  return "orpheus://" + Buffer.from(JSON.stringify(payload)).toString("base64");
}

export async function playSong(songId, title) {
  const url = buildOrpheusUrl(songId);
  if (platform() === "win32") {
    // cmd /c start is quieter than PowerShell Start-Process — no extra window flash
    spawn("cmd", ["/c", "start", "", url], { stdio: "ignore" });
  } else {
    spawn("open", [url], { stdio: "ignore" });
  }

  currentStatus = { type: "status", state: "playing", songName: title || "", songId: String(songId) };
  return currentStatus;
}

export async function stopPlayer() {
  currentStatus = { type: "idle", state: "stopped" };
}
