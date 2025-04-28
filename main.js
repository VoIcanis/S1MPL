const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const AdmZip = require('adm-zip');
const os = require('os');

const { version } = require('./package.json');
const appDir = process.cwd();

function createWindow() {
  const win = new BrowserWindow({
    width: 700,
    height: 600,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

const getSteamID = () => {
  const steamConfigPath = path.join(
    process.env['PROGRAMFILES(X86)'] || 'C:/Program Files (x86)',
    'Steam/config/loginusers.vdf'
  );

  try {
    const content = fs.readFileSync(steamConfigPath, 'utf-8');
    const match = content.match(/"(\d{17})"[\s\S]*?"MostRecent"\s*"1"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

ipcMain.handle('get-app-version', () => {
  return version;
});

ipcMain.on('open-folder', (_, type) => {
  const isPackaged = app.isPackaged;
  const steamID = getSteamID();
  const base = isPackaged ? path.dirname(app.getPath('exe')) : process.cwd();

  let targetPath;

  switch (type) {
    case 'save':
      targetPath = path.join(base, 'savedata');
      break;
    case 'player':
      targetPath = path.join(base, 'playerdata');
      break;
    case 'game':
      targetPath = path.join(os.homedir(), 'AppData', 'LocalLow', 'TVGS', 'Schedule I', 'Saves', steamID);
      break;
  }

  if (targetPath) {
    if (type === 'save' || type === 'player') {
      fs.ensureDirSync(targetPath);
    }
    shell.openPath(targetPath);
  }
});

ipcMain.handle('get-saves', async () => {
  const steamID = getSteamID() || 'UNKNOWN';
  const base = path.join(os.homedir(), 'AppData/LocalLow/TVGS/Schedule I/Saves', steamID);
  const slots = [];

  for (let i = 1; i <= 5; i++) {
    const slotName = `SaveGame_${i}`;
    const slotPath = path.join(base, slotName);
    const exists = await fs.pathExists(slotPath);

    slots.push({
      name: exists ? slotName : `${slotName} [Empty]`,
      actualName: slotName,
      path: slotPath,
      exists
    });
  }

  return { steamID, base, slots };
});

ipcMain.handle('import-zip', async (_, saveZipPath, targetSlot, steamID) => {
  const tempPath = path.join(appDir, 'temp_unzip');
  fs.ensureDirSync(tempPath);
  fs.emptyDirSync(tempPath);

  const zip = new AdmZip(saveZipPath);
  zip.extractAllTo(tempPath, true);

  
  const hasPlayers = await fs.pathExists(path.join(tempPath, 'Players'));
  if (!hasPlayers) {
    return { error: 'Invalid save structure: missing Players folder.' };
  }

  
  if (await fs.pathExists(targetSlot)) {
    await fs.remove(targetSlot);
  }

  
  await fs.copy(tempPath, targetSlot);

  return { success: true };
});

ipcMain.handle('zip-save-slot', async (event, slotPath) => {
  try {
    const slotName = path.basename(slotPath);
    const saveDir = path.join(process.cwd(), 'savedata');
    const outputZip = path.join(saveDir, `${slotName}.zip`);

    await fs.ensureDir(saveDir);

    if (await fs.pathExists(outputZip)) {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Overwrite', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'Confirm Overwrite',
        message: `The file "${slotName}.zip" already exists. Overwrite it?`
      });

      if (response === 1) return { success: false, cancelled: true };
    }

    const zip = new AdmZip();
    zip.addLocalFolder(slotPath);
    zip.writeZip(outputZip);

    return { success: true, filename: `${slotName}.zip` };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-players-in-slot', async (_, slotPath) => {
  const playersDir = path.join(slotPath, 'Players');
  if (!fs.existsSync(playersDir)) return [];

  const folders = fs.readdirSync(playersDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const result = [];

  for (const folder of folders) {
    const playerJsonPath = path.join(playersDir, folder, 'Player.json');
    if (fs.existsSync(playerJsonPath)) {
      try {
        const data = await fs.readJSON(playerJsonPath);
        result.push({
          folder,
          steamID: data.PlayerCode,
          isMain: folder === 'Player_0',
        });
      } catch (e) {
        result.push({ folder, error: 'Invalid JSON' });
      }
    } else {
      result.push({ folder, error: 'Missing Player.json' });
    }
  }

  return result;
});

ipcMain.handle('extract-player', async (_, slotPath, playerFolder, customName) => {
  try {
    const playerSource = path.join(slotPath, 'Players', playerFolder);
    const dest = path.join(process.cwd(), 'playerdata', customName);

    if (await fs.pathExists(dest)) {
      const { response } = await dialog.showMessageBox({
        type: 'question',
        buttons: ['Overwrite', 'Cancel'],
        defaultId: 1,
        cancelId: 1,
        title: 'Confirm Overwrite',
        message: `A folder named "${customName}" already exists in playerdata.\nDo you want to overwrite it?`
      });

      if (response === 1) return { success: false, cancelled: true };

      await fs.remove(dest); 
    }

    await fs.ensureDir(dest);
    await fs.copy(playerSource, dest);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

const playerDataDir = path.join(appDir, 'playerdata');

ipcMain.handle('list-playerdata', async () => {
  try {
    const entries = await fs.readdir(playerDataDir, { withFileTypes: true });

    const players = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const folderName = entry.name;
      const playerJson = path.join(playerDataDir, folderName, 'Player.json');

      let steamID = 'Unknown';

      if (await fs.pathExists(playerJson)) {
        try {
          const data = await fs.readJSON(playerJson);
          steamID = data.PlayerCode || 'Unknown';
        } catch (err) {
          steamID = 'Invalid JSON';
        }
      }

      players.push({
        folder: folderName,
        steamID: steamID
      });
    }

    return players;
  } catch {
    return [];
  }
});

ipcMain.handle('check-player-exists', async (_, slotPath, folderName) => {
  const playerPath = path.join(slotPath, 'Players', folderName);
  return { exists: await fs.pathExists(playerPath) };
});

ipcMain.handle('inject-player', async (_, slotPath, extractedFolder, targetFolder) => {
  try {
    const source = path.join(playerDataDir, extractedFolder);
    const dest = path.join(slotPath, 'Players', targetFolder);

    
    if (await fs.pathExists(dest)) {
      await fs.remove(dest);
    }

    await fs.copy(source, dest);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('get-steamid-from-playerdata', async (_, folderName) => {
  const playerJsonPath = path.join(__dirname, 'playerdata', folderName, 'Player.json');
  try {
    const data = await fs.readJSON(playerJsonPath);
    return { steamID: data.PlayerCode || null };
  } catch (err) {
    return { error: 'Failed to read Player.json' };
  }
});

ipcMain.handle('check-inject-conflict', async (_, slotPath, extractedFolder, injectAsMain) => {
  const extractedJsonPath = path.join(__dirname, 'playerdata', extractedFolder, 'Player.json');
  const playersDir = path.join(slotPath, 'Players');

  if (!await fs.pathExists(extractedJsonPath)) {
    return { error: 'Extracted Player.json missing' };
  }

  const extractedData = await fs.readJSON(extractedJsonPath);
  const extractedSteamID = extractedData.PlayerCode;

  const potentialConflictFolder = path.join(playersDir, `Player_${extractedSteamID}`);
  const playerZeroPath = path.join(playersDir, 'Player_0', 'Player.json');

  if (injectAsMain) {
    
    if (await fs.pathExists(potentialConflictFolder)) {
      return { conflict: 'secondaryExists', steamID: extractedSteamID };
    }
  } else {
    
    if (await fs.pathExists(playerZeroPath)) {
      const currentMainData = await fs.readJSON(playerZeroPath);
      if (currentMainData.PlayerCode === extractedSteamID) {
        return { conflict: 'sameAsMain', steamID: extractedSteamID };
      }
    }
  }

  return { ok: true, steamID: extractedSteamID };
});

ipcMain.handle('delete-player-folder', async (_, slotPath, folderName) => {
  try {
    const toDelete = path.join(slotPath, 'Players', folderName);
    await fs.remove(toDelete);
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('save-slot-exists', async (_, slotPath) => {
  try {
    const exists = await fs.pathExists(slotPath);
    return { exists };
  } catch (err) {
    return { exists: false, error: err.message };
  }
});

ipcMain.on('window-control', (event, action) => {
  const window = BrowserWindow.getFocusedWindow();
  if (!window) return;

  switch (action) {
    case 'minimize':
      window.minimize();
      break;
    case 'maximize':
      if (window.isMaximized()) window.unmaximize();
      else window.maximize();
      break;
    case 'close':
      window.close();
      break;
  }
});