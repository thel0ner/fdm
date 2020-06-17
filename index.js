const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const autoUpdater = require('electron-updater').autoUpdater;
const appVersion = process.env.npm_package_version
app.on(
    "ready",
    () => {
        let win = new BrowserWindow(
            {
                width: 860,
                height: 700,
                icon: __dirname + '/icon.png',
                webPreferences: {
                    nodeIntegration: true,
                    allowRunningInsecureContent: true
                }
            }
        );
        win.loadFile("./index.html");
        win.setResizable(false);
        Menu.setApplicationMenu(null);
        // win.webContents.openDevTools();
        win.on('new-window', function (event, url) {
            event.preventDefault();
            open(url);
        });
        win.once('ready-to-show', () => {
            autoUpdater.checkForUpdatesAndNotify();
        });
        autoUpdater.on('update-available', () => {
            win.webContents.send('update_available');
        });
        autoUpdater.on('update-downloaded', () => {
            win.webContents.send('update_downloaded');
        });
    }
);
ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
    // app.relaunch();
    // app.exit();
});