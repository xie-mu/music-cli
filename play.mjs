import { spawn } from "node:child_process";
import { platform } from "node:os";

const songId = process.argv[2] || "1807799505";
const songName = process.argv[3] || "歌曲";

console.log("🎵 " + songName);

const orpheusUrl = "orpheus://song/" + songId;
if (platform() === "win32") {
  // cmd /c start is quieter than PowerShell Start-Process — no extra window flash
  spawn("cmd", ["/c", "start", "", orpheusUrl], { stdio: "ignore" });
} else {
  spawn("open", [orpheusUrl], { stdio: "ignore" });
}
console.log("✅ 后台推送中");
