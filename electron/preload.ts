const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  updateUserPassword: (userId: string, newPassword: string) =>
    ipcRenderer.invoke('update-user-password', { userId, newPassword }),

  getUserByEmail: (email: string) =>
    ipcRenderer.invoke('get-user-by-email', email),
});