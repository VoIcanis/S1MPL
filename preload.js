const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSaves: () => ipcRenderer.invoke('get-saves'),
  zipSave: (slotPath) => ipcRenderer.invoke('zip-save-slot', slotPath),
  getPlayers: (slotPath) => ipcRenderer.invoke('get-players-in-slot', slotPath),
  extractPlayer: (slotPath, playerFolder, customName) =>
    ipcRenderer.invoke('extract-player', slotPath, playerFolder, customName),  
  importZip: (zip, slot, steamid, characterSrc) =>
    ipcRenderer.invoke('import-zip', zip, slot, steamid, characterSrc),
  getExtractedPlayers: () => ipcRenderer.invoke('list-playerdata'),
  checkPlayerFolder: (slotPath, folderName) => ipcRenderer.invoke('check-player-exists', slotPath, folderName),
  injectPlayer: (slotPath, extractedFolder, targetFolder) =>
    ipcRenderer.invoke('inject-player', slotPath, extractedFolder, targetFolder),
  getSteamIDFromExtracted: (folderName) =>
    ipcRenderer.invoke('get-steamid-from-playerdata', folderName),
  checkInjectConflict: (slotPath, extractedFolder, injectAsMain) =>
    ipcRenderer.invoke('check-inject-conflict', slotPath, extractedFolder, injectAsMain),
  deletePlayerFolder: (slotPath, folderName) =>
    ipcRenderer.invoke('delete-player-folder', slotPath, folderName),      
  saveSlotExists: (slotPath) => ipcRenderer.invoke('save-slot-exists', slotPath),
  windowControl: (action) => ipcRenderer.send('window-control', action),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openFolder: (type) => ipcRenderer.send('open-folder', type),
});
