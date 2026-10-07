// Exposes a tiny, read only API to the game so it can use an edited content folder next to the .exe.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('softDesktop', {
  readContent: (name) => ipcRenderer.invoke('soft:readContent', name),
  contentFolder: () => ipcRenderer.invoke('soft:contentFolder'),
  quit: () => ipcRenderer.send('soft:quit'),
});
