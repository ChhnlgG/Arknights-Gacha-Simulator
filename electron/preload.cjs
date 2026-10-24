const { contextBridge } = require('electron');

try {
  contextBridge.exposeInMainWorld('arkApp', {
    version: process.versions.electron,
    node: process.versions.node,
    platform: process.platform,
  });
} catch (_) {}
