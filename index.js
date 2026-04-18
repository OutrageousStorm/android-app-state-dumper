#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function adb(cmd) {
  try {
    return execSync(`adb shell ${cmd}`, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

function dumpApp(pkg) {
  console.log(`\n📱 Dumping ${pkg}`);
  console.log("━".repeat(50));

  const manifest = adb(`dumpsys package ${pkg} | grep -A 20 'android.intent'`);
  const activities = manifest.split("\n").filter((l) => l.includes("Activity"));
  
  const prefs = adb(`dumpsys package ${pkg} | grep SharedPreferences`);
  
  const cache = adb(`du -sh /data/data/${pkg}/cache`);
  const files = adb(`ls -la /data/data/${pkg}/files 2>/dev/null | wc -l`);
  
  const memory = adb(`dumpsys meminfo ${pkg}`);
  const ram = memory.split("\n")[0] || "(unknown)";

  return {
    package: pkg,
    activities: activities.length,
    prefFiles: prefs.split("\n").length,
    cacheSize: cache.split("\t")[0],
    fileCount: files,
    memory: ram,
  };
}

function main() {
  const apps = adb("pm list packages -3").split("\n").map((l) => l.replace("package:", ""));
  
  console.log("\n📊 Android App State Dumper");
  console.log(`Found ${apps.length} user apps\n`);

  const results = [];
  for (const app of apps.slice(0, 10)) {
    results.push(dumpApp(app));
  }

  console.log("\n📋 Summary (top 10):");
  console.table(results);

  // Save to JSON
  fs.writeFileSync("app_state.json", JSON.stringify(results, null, 2));
  console.log("\n✅ Saved to app_state.json");
}

main();
