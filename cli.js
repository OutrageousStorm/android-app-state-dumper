#!/usr/bin/env node
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function adb(cmd) {
    return new Promise((resolve, reject) => {
        exec(`adb shell ${cmd}`, (err, stdout) => {
            if (err) reject(err);
            resolve(stdout.trim());
        });
    });
}

async function dumpSharedPrefs(pkg) {
    console.log(`📋 SharedPreferences for ${pkg}:`);
    const result = await adb(`dumpsys --dump-priority CRITICAL ${pkg}`);
    const lines = result.split('\n').filter(l => l.includes('_preferences'));
    lines.forEach(l => console.log(`  ${l}`));
}

async function dumpAppData(pkg) {
    console.log(`📂 App data size:`);
    const sizes = await adb(`du -sh /data/data/${pkg} 2>/dev/null || echo "N/A"`);
    console.log(`  ${sizes}`);
}

async function dumpLogs(pkg) {
    console.log(`📝 Recent logs:`);
    const logs = await adb(`logcat --pid=$(pidof ${pkg}) -d | head -20`);
    console.log(logs);
}

async function main() {
    const pkg = process.argv[2] || 'com.example.app';
    console.log(`\n🔍 App State Analyzer -- ${pkg}\n`);
    
    try {
        await dumpSharedPrefs(pkg);
        console.log();
        await dumpAppData(pkg);
        console.log();
        await dumpLogs(pkg);
    } catch (e) {
        console.error('Error:', e.message);
    }
}

main();
