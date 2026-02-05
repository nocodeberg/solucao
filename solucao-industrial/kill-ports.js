const { execSync } = require('child_process');
try { execSync('taskkill /IM node.exe /F'); console.log('Killed all node.exe'); } catch(e) { console.log('No node.exe to kill'); }
