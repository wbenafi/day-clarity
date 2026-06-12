const { app, BrowserWindow } = require('electron')
const path = require('node:path')

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL)
const appIconPath = isDev
  ? path.join(__dirname, '../public/app-icon.png')
  : path.join(__dirname, '../dist/app-icon.png')

function createWindow() {
  const mainWindow = new BrowserWindow({
    backgroundColor: '#F7F5F0',
    height: 760,
    icon: appIconPath,
    minHeight: 640,
    minWidth: 960,
    title: 'DayClarity',
    width: 1100,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    return
  }

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(appIconPath)
  }

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
