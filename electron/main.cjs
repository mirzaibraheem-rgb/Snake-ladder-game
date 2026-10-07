// SOFT Snakes and Ladders: Windows desktop shell (Electron).
// The game itself is the same web build used on the web and on phones (dist/).
const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

const ALLOWED = new Set(['snake_messages.txt', 'ladder_messages.txt', 'tile_texts.txt', 'ui_strings.json']);

/**
 * Folders checked for an editable "content" folder, in order:
 *  1. Next to the portable .exe (electron-builder sets PORTABLE_EXECUTABLE_DIR)
 *  2. Next to the installed .exe (the installer puts a content folder there)
 *  3. When running from source: the project's content folder
 */
function contentDirs() {
  const dirs = [];
  if (process.env.PORTABLE_EXECUTABLE_DIR) dirs.push(path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'content'));
  dirs.push(path.join(path.dirname(app.getPath('exe')), 'content'));
  if (!app.isPackaged) dirs.push(path.join(__dirname, '..', 'content'));
  return dirs;
}

function readContent(name) {
  if (!ALLOWED.has(name)) return null;
  for (const dir of contentDirs()) {
    const file = path.join(dir, name);
    try {
      if (fs.existsSync(file)) {
        const text = fs.readFileSync(file, 'utf8');
        console.log(`[content] using ${file}`);
        return text;
      }
    } catch (e) {
      console.warn(`[content] could not read ${file}:`, e.message);
    }
  }
  return null;
}

ipcMain.handle('soft:readContent', (_e, name) => readContent(String(name)));
ipcMain.handle('soft:contentFolder', () => contentDirs().find((d) => fs.existsSync(d)) ?? null);
ipcMain.on('soft:quit', () => app.quit());

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 480,
    minHeight: 480,
    backgroundColor: '#5B1E96',
    title: 'SOFT Snakes and Ladders',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  Menu.setApplicationMenu(null);
  win.once('ready-to-show', () => win.show());
  // The game never opens web pages. Block any navigation away from the game files.
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('before-input-event', (_e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') win.setFullScreen(!win.isFullScreen());
  });
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => app.quit());
