const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function resolveIcon() {
  const candidates = isDev
    ? [
        path.join(__dirname, 'assets', 'icon.ico'),
        path.join(__dirname, 'assets', 'icon.png'),
      ]
    : [
        path.join(process.resourcesPath, 'assets', 'icon.ico'),
        path.join(process.resourcesPath, 'assets', 'icon.png'),
        path.join(__dirname, 'assets', 'icon.ico'),
        path.join(__dirname, 'assets', 'icon.png'),
      ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return undefined;
}

function createWindow() {
  const iconPath = resolveIcon();

  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1024,
    minHeight: 680,
    backgroundColor: '#07070f',
    title: '明日方舟 - 寻访模拟器',
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    show: false,
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    win.loadURL('http://127.0.0.1:5173');
    try { win.webContents.openDevTools({ mode: 'detach' }); } catch (_) {}
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    win.loadFile(indexPath);
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    try { shell.openExternal(url); } catch (_) {}
    return { action: 'deny' };
  });
}

function buildMenu() {
  const template = [
    {
      label: '文件',
      submenu: [
        { role: 'reload', label: '重新加载' },
        { role: 'forceReload', label: '强制重新加载' },
        { type: 'separator' },
        { role: 'quit', label: '退出程序' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo', label: '撤销' },
        { role: 'redo', label: '重做' },
        { type: 'separator' },
        { role: 'cut', label: '剪切' },
        { role: 'copy', label: '复制' },
        { role: 'paste', label: '粘贴' },
        { role: 'selectAll', label: '全选' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'resetZoom', label: '重置缩放' },
        { role: 'zoomIn', label: '放大' },
        { role: 'zoomOut', label: '缩小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '全屏切换' },
        {
          label: '开发者工具',
          accelerator: process.platform === 'darwin' ? 'Alt+Command+I' : 'Ctrl+Shift+I',
          click: (_, win) => win && win.webContents.toggleDevTools(),
        },
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于本程序',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: '明日方舟寻访模拟器',
              message: '明日方舟 - 寻访模拟器',
              detail:
                '版本: ' + app.getVersion() +
                '\nElectron: ' + process.versions.electron +
                '\n\n本模拟器仅供学习娱乐使用。\n明日方舟 © Hypergryph / 鹰角网络',
              icon: resolveIcon(),
            });
          },
        },
      ],
    },
  ];

  try {
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  } catch (e) {
    Menu.setApplicationMenu(null);
  }
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
