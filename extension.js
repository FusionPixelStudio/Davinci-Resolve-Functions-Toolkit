// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

async function setDefaults() {
  const config = vscode.workspace.getConfiguration('davinci-resolve-function-toolkit', vscode.ConfigurationTarget.Global);

  const username = os.userInfo().username;
  let scriptsPath;
  if (process.platform === "darwin") {
    scriptsPath = `/Users/${username}/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts`;
  } else if (process.platform === "win32") {
    scriptsPath = `C:\\Users\\${username}\\AppData\\Roaming\\Blackmagic Design\\DaVinci Resolve\\Support\\Fusion\\Scripts`;
  } else {
    scriptsPath =  `/home/${username}/.local/share/DaVinciResolve/Fusion/Scripts`
  }

  let WIpath;
  if (process.platform === "darwin") {
    WIpath = `/Library/Application Support/Blackmagic Design/DaVinci Resolve/Workflow Integration Plugins`;
  } else if (process.platform === "win32") {
    WIpath = `C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\Workflow Integration Plugins`;
  } else {
    WIpath = `Workflow Integrations not available on Linux`
  }

  let GlobalscriptsPath;
  if (process.platform === "darwin") {
    GlobalscriptsPath = `/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts`;
  } else if (process.platform === "win32") {
    GlobalscriptsPath = `C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Fusion\\Scripts`;
  } else {
    GlobalscriptsPath =  `/opt/resolve/Fusion/Scripts`
  }

  let defaultUserScriptsPath = await config.get('UserScriptsPath', "");
  console.log("Default User Scripts Path:", defaultUserScriptsPath);
  if (defaultUserScriptsPath === "") {
    await config.update('UserScriptsPath', scriptsPath, vscode.ConfigurationTarget.Global);
    defaultUserScriptsPath = await config.get('UserScriptsPath', "");
    console.log("Default User Scripts Path:", defaultUserScriptsPath);
  }
  let defaultGlobalScriptsPath = await config.get('GlobalScriptsPath', "");
  console.log("Default Global Scripts Path:", defaultGlobalScriptsPath);
  if (defaultGlobalScriptsPath === "") {
    await config.update('GlobalScriptsPath', GlobalscriptsPath, vscode.ConfigurationTarget.Global);
    defaultGlobalScriptsPath = await config.get('GlobalScriptsPath', "");
    console.log("Default Global Scripts Path:", defaultGlobalScriptsPath);
  }
  let defaultWIPath = await config.get('WorkflowIntegrationPath', "");
  console.log("Default Workflow Integration Path:", defaultWIPath);
  if (defaultWIPath === "") {    
    await config.update('WorkflowIntegrationPath', WIpath, vscode.ConfigurationTarget.Global);
    defaultWIPath = await config.get('WorkflowIntegrationPath', "");
    console.log("Default Workflow Integration Path:", defaultWIPath);
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  console.log('Congratulations, your extension "davinci-resolve-function-toolkit" is now active!');
  
  await setDefaults()
  
  const config = vscode.workspace.getConfiguration('davinci-resolve-function-toolkit', vscode.ConfigurationTarget.Global);

  async function fileExists(uri) {
    try {
        await vscode.workspace.fs.stat(uri);
        return true; // The file exists
    } catch (error) {
        if (error.code === 'FileNotFound') {
            return false; // The file does not exist
        }
        throw error; // Some other error occurred
    }
  }

  async function getFoldersInDirectory(directoryUri) {
    const folders = [];

    try {
        // Read the contents of the directory
        const entries = await vscode.workspace.fs.readDirectory(directoryUri);

        // Filter the entries to get only folders
        for (const [name, fileType] of entries) {
            if (fileType === vscode.FileType.Directory) {
                folders.push(name);
            }
        }
    } catch (error) {
        console.error(`Failed to read directory: ${error}`);
    }

    return folders;
  }

  function openFolderInExplorer(folderPath) {
    const platform = process.platform;
    if (platform === 'win32') {
      exec(`start "" "${folderPath}"`);
    } else if (platform === 'darwin') {
      exec(`open "${folderPath}"`);
    } else if (platform === 'linux') {
      exec(`xdg-open "${folderPath}"`);
    }
  }

function downloadBinaryFile(url, savePath) {
  return new Promise((resolve, reject) => {
      // vscode.window.showInformationMessage(`Starting download from: ${url}`);

      const makeRequest = (currentUrl) => {
          https.get(currentUrl, (response) => {
              // vscode.window.showInformationMessage(`HTTP Status Code: ${response.statusCode}`);

              // Handle redirect
              if (response.statusCode === 302 || response.statusCode === 301) {
                  const newLocation = response.headers.location;
                  // vscode.window.showInformationMessage(`Redirecting to: ${newLocation}`);
                  makeRequest(newLocation); // Follow the redirect
                  return;
              }

              if (response.statusCode === 200) {
                  const directory = path.dirname(savePath);
                  if (!fs.existsSync(directory)) {
                      fs.mkdirSync(directory, { recursive: true });
                  }

                  const file = fs.createWriteStream(savePath);
                  response.pipe(file);

                  file.on('finish', () => {
                      file.close(() => {
                          // vscode.window.showInformationMessage(`File downloaded successfully: ${savePath}`);
                          resolve();
                      });
                  });

                  file.on('error', (err) => {
                      fs.unlinkSync(savePath); // Delete the file on error
                      // vscode.window.showErrorMessage(`Error writing file: ${err.message}`);
                      reject(err);
                  });
              } else {
                  // vscode.window.showErrorMessage(`Failed to download file. Status: ${response.statusCode}`);
                  reject(new Error(`HTTP error: ${response.statusCode}`));
              }
          }).on('error', (err) => {
              // vscode.window.showErrorMessage(`Request error: ${err.message}`);
              reject(err);
          });
      };

      makeRequest(url); // Start the initial request
  });
}

  const downloadOther = vscode.commands.registerCommand('davinci-resolve-function-toolkit.downloadOtherOSNode', async function () {
    let rawpath = vscode.workspace.workspaceFolders
    if (rawpath) {
      let path = rawpath[0].uri.toString(true).slice(8)

      if (process.platform === "darwin") {
        githubRawUrl = 'https://github.com/FusionPixelStudio/Example-Workflow-Integration/raw/refs/heads/main/WorkflowIntegration_Win.node';
        outputPath = path + '/WorkflowIntegration_Win.node';
      } else if (process.platform === "win32") {
        githubRawUrl = 'https://github.com/FusionPixelStudio/Example-Workflow-Integration/raw/refs/heads/main/WorkflowIntegration_Mac.node';
        outputPath = path + '/WorkflowIntegration_Mac.node';
      } else {
        vscode.window.showErrorMessage("Workflow Integrations not yet supported on Linux");
        return;
      }
      
      await downloadBinaryFile(githubRawUrl, outputPath)
      .then(() => vscode.window.showInformationMessage('Download completed.'))
      .catch(err => vscode.window.showErrorMessage(`Download failed: ${err.message || err}`));

    } else {
      vscode.window.showErrorMessage("No Folder is Open in Explorer!");
      return;
    }
  });

  const openScriptsUserFolder = vscode.commands.registerCommand('davinci-resolve-function-toolkit.openScriptsUserFolder', async function () {
    let scriptsPath;
    scriptsPath = await config.get('UserScriptsPath', "");
    const scripts = vscode.Uri.file(scriptsPath)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find User DVR Scripts Folder!\nUpdate it in settings!\n" + scriptsPath);
      return;
    }
    openFolderInExplorer(scriptsPath)
  });
  const openScriptsGlobalFolder = vscode.commands.registerCommand('davinci-resolve-function-toolkit.openScriptsGlobalFolder', async function () {
    let scriptsPath;
    scriptsPath = await config.get('GlobalScriptsPath', "");
    const scripts = vscode.Uri.file(scriptsPath)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find Global DVR Scripts Folder!\nUpdate it in settings!\n" + scriptsPath);
      return;
    }
    openFolderInExplorer(scriptsPath)
  });
  const openWIFolder = vscode.commands.registerCommand('davinci-resolve-function-toolkit.openWIFolder', async function () {
    let path;
    path = await config.get('WorkflowIntegrationPath', "");
    if (path === "Workflow Integrations not available on Linux") {
      vscode.window.showErrorMessage("Workflow Integrations not available on Linux");
      return;
    }
    const scripts = vscode.Uri.file(path)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find Global DVR Workflow Integrations Folder!\nUpdate it in settings!\n" + path);
      return;
    }
    openFolderInExplorer(path)
  });
  const openCurrFolder = vscode.commands.registerCommand('davinci-resolve-function-toolkit.openCurrFolder', async function () {
    let rawpath = vscode.workspace.workspaceFolders
    if (rawpath) {
      let path = rawpath[0].uri.toString(true).slice(8)
      const scripts = vscode.Uri.file(path)
      const exists = await fileExists(scripts);
      if (!exists) {
        vscode.window.showErrorMessage("Could Not Find Global DVR Scripts Folder!\n" + path);
        return;
      }
      openFolderInExplorer(path)
    } else {
      vscode.window.showErrorMessage("No Folder is Open in Explorer!");
      return;
    }

  });

  const createScript = vscode.commands.registerCommand('davinci-resolve-function-toolkit.createScript', async function () {
    let scriptsPath;
    scriptsPath = await config.get('UserScriptsPath', "");
    console.log(scriptsPath)
    const scripts = vscode.Uri.file(scriptsPath)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find DVR Scripts Folder!\nUpdate it in settings!\n" + scriptsPath);
      return;
    }

    const scriptFolders = await getFoldersInDirectory(scripts)
    
    let panel = vscode.window.createWebviewPanel(
      'script',
      'Scripts Setup',
      vscode.ViewColumn.One,
      {enableScripts:true}
    );
    panel.webview.html = getScriptsContent();
    panel.webview.onDidReceiveMessage(message=>{
      switch(message.command){
        case 'alert':
          vscode.window.showInformationMessage(message.text);
          if (message.lang === "Python") {
            message.lang = "Py"
          }
          let newFile = vscode.Uri.file(scripts.toString(true).slice(8)+`/${message.folder}/${message.name}.${message.lang.toLowerCase()}`)
          panel.dispose();
          vscode.workspace.fs.writeFile(newFile, new TextEncoder().encode(''))
          const document = vscode.workspace.openTextDocument(newFile);
          vscode.window.showTextDocument(document, {preview:false});
          return;
        case 'getDefault':
          panel.webview.postMessage({ command: 'setDefault', scriptFolders });
          return;
      }
    })
  });

  function cleanResolvePath(path) {
    // Check if "Support" exists in the path
    if (path.includes("Support")) {
      // Find the index of "DaVinci Resolve" and cut off everything after it
      const marker = "Support";
      const index = path.indexOf(marker);

      if (index !== -1) {
          // Return the part of the path up to and including "DaVinci Resolve"
          return path.substring(0, index + marker.length);
      }
    }

    // Find the index of "DaVinci Resolve" and cut off everything after it
    const marker = "DaVinci Resolve";
    const index = path.indexOf(marker);

    if (index !== -1) {
        // Return the part of the path up to and including "DaVinci Resolve"
        return path.substring(0, index + marker.length);
    }

    // Return the original path if "DaVinci Resolve" isn't found
    return path;
  }

  async function pickFolder() {
    const options = {
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Folder'
    };

    const folderUri = await vscode.window.showOpenDialog(options);
    if (folderUri && folderUri.length > 0) {
        console.log('Selected folder:', folderUri[0].fsPath);
        return folderUri[0].fsPath;
    } else {
        return null; // No folder selected
    }
  }

	const createWorkflow = vscode.commands.registerCommand('davinci-resolve-function-toolkit.createWorkflow', async function () {

    function createProj(userName, projName, description, ver, lic) {
      let packageName = projName.toLowerCase().replace(/\s+/g, '-');
      let packageID = userName.replace(/\s+/g, '') + '.' + projName.replace(/\s+/g, '');
      indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
    <title>${projName}</title>
    <link rel="stylesheet" type="text/css" href="css/styles.css" />
    <script type="text/javascript" src="./renderer.js"></script>
</head>
<body>
    <h1>Hello World!</h1>
    We are using Node.js <span id="node-version"></span>,
    Chromium <span id="chrome-version"></span>,
    and Electron <span id="electron-version"></span>.

    <script type="text/javascript" src="./js/app.js"></script>
  </body>
</body>
</html>`

		mainJS = `// NOTE: Follow the security guide while implementing plugin app https://www.electronjs.org/docs/tutorial/security
const {app, BrowserWindow, ipcMain, shell, Menu} = require('electron')
const path = require('path');

const PLUGIN_ID = 'com.${packageID}'

if (process.platform === "darwin") {
    WorkflowIntegration = require(path.join(__dirname, "WorkflowIntegration_Mac.node"));
} else {
    WorkflowIntegration = require(path.join(__dirname, 'WorkflowIntegration_Win.node'));
}

// Cached objects
let resolveObj = null;
let projectManagerObj = null;

// Initialize Resolve interface and returns Resolve object.
async function initResolveInterface() {
    // Initialize resolve interface
    const isSuccess = await WorkflowIntegration.Initialize(PLUGIN_ID);
    if (!isSuccess) {
        throw new Error('Error: Failed to initialize Resolve interface!');
        return null;
    }

    // Get resolve interface object
    resolveInterfacObj = await WorkflowIntegration.GetResolve();
    if (!resolveInterfacObj) {
        throw new Error('Error: Failed to get Resolve object!');
        return null;
    }

    return resolveInterfacObj
}

// Cleanup Resolve interface.
function cleanup() {
    const isSuccess = WorkflowIntegration.CleanUp();
    if (!isSuccess) {
        throw new Error('Error: Failed to cleanup Resolve interface!');
    }

    resolveObj = null;
    projectManagerObj = null;
}

// Gets Resolve object.
async function getResolve() {
    if (!resolveObj) {
        resolveObj = await initResolveInterface();
    }

    return resolveObj;
}

// Gets project manager object.
async function getProjectManager() {
    if (!projectManagerObj) {
        resolve = await getResolve();
        if (resolve) {
            projectManagerObj = await resolve.GetProjectManager();
            if (!projectManagerObj) {
                throw new Error('Error: Failed to get ProjectManager object!');
            }
        }
    }

    return projectManagerObj;
}

// Gets current project object.
async function getCurrentProject() {
    curProjManager = await getProjectManager();
    if (curProjManager) {
        currentProject = await curProjManager.GetCurrentProject();
        if (!currentProject) {
            throw new Error('Error: Failed to get current project object!');
        }

        return currentProject;
    }

    return null;
}

// Gets media pool object.
async function getMediaPool() {
    currentProject = await getCurrentProject();
    if (currentProject) {
        mediaPool = await currentProject.GetMediaPool();
        if (!mediaPool) {
            throw new Error('Error: Failed to get MediaPool object!');
        }

        return mediaPool;
    }

    return null;
}

// Gets the current timeline object
async function getCurrentTimeline() {
    currentProject = await getCurrentProject();
    if (currentProject) {
        timeline = await currentProject.GetCurrentTimeline();
        if (!timeline) {
            throw new Error('Error: Failed to get Current Timeline object!')
        }

        return timeline;
    }

    return null;
}

// Gets the current timeline track count
async function getTrackCount(event, trackType) {
    if (typeof trackType !== "string" && trackType) {
        throw new Error("Track Type must be a string!")
        return null;
    } else if (!trackType) {
        throw new Error("Track Type must be provided!")
        return null;
    }
    timeline = await getCurrentTimeline()
    if (timeline) {
        return await timeline.GetTrackCount(trackType);
    }

    return null;
}

// Register resolve event handler functions.
function registerResolveEventHandlers() {
    // Resolve
    ipcMain.handle('resolve:trackCount', getTrackCount);
}

const createWindow = () => {
    const win = new BrowserWindow ({
        height: 500,
        width: 300,
        useContentSize: true,
        show: false,
        icon: path.join(__dirname, 'img/logo.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Show the main window once the content is ready and close the loading window
    win.once('ready-to-show', () => {
        win.show()
    })

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
      });
    
    // Hide the menu bar (enable below code to hide menu bar)
    //win.setMenu(null);

    win.on('close', function(e) {
        cleanup();
        app.quit();
    });

    // Load index.html on the window.
    win.loadFile('index.html');

    // Open the DevTools (enable below code to show DevTools)
    //win.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    registerResolveEventHandlers();
    createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        cleanup();
        app.quit();
    }
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});`

		manifestXML = `<?xml version="1.0" encoding="UTF-8"?>
<BlackmagicDesign>
    <Plugin>
        <Id>com.${packageID}</Id>
        <Name>${projName}</Name>
        <Version>${ver}</Version>
        <Description>${description}</Description>
        <FilePath>main.js</FilePath>
    </Plugin>
</BlackmagicDesign>`

		packageJSON = `{
  "name": "${packageName}",
  "version": "${ver}",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  },
  "keywords": [],
  "author": "${userName}",
  "license": "${lic}",
  "description": "${description}"
}`

		preloadJS = `// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const { contextBridge, ipcRenderer } = require('electron/renderer')

const API = {
  // Resolve
  trackCount: (trackType) => ipcRenderer.invoke('resolve:trackCount', (trackType)), // Function Found in Main. Can be used in app.js
}

contextBridge.exposeInMainWorld('appAPI', API);

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const dependency of ['chrome', 'node', 'electron']) {
    replaceText(\`\${dependency}-version\`, process.versions[dependency])
  }
})`

		rendererJS = `// This file is required by the index.html file and will
// be executed in the renderer process for that window.`

		appJS = `window.onload = async function () {
    const trackCount = await window.appAPI.trackCount('subtitle') // Requires await call inside async function
    console.log(trackCount)
}`

    stylescss = `*{
  margin: 0;
  padding: 0;    
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
  
h1{
  font-size: 2rem;
  font-weight: 800;
}`
    }

    let WIFolder
    let WIName
    WIFolder = await config.get('WorkflowIntegrationPath', "");
    if (WIFolder === "Workflow Integrations not available on Linux") {
      vscode.window.showErrorMessage("Workflow Integrations not available on Linux");
      return;
    }
		if (process.platform === "darwin") {
      WIName = '/WorkflowIntegration_Mac.node'
		} else if (process.platform === "win32") {
      WIName = '/WorkflowIntegration_Win.node'
		}
    WIFolder = path.join(await cleanResolvePath(WIFolder), `/Developer/Workflow Integrations/Examples/SamplePlugin/WorkflowIntegration.node`);
    console.log(WIFolder)
    const WI = vscode.Uri.file(WIFolder);
    fileExists(WI).then(exists => {
      if (!exists) {  
        vscode.window.showErrorMessage("Workflow Integration File Could Not be Retrieved!\nContact Asher with details!\n" + WIFolder);
        return
      }
    });

		function createWorkflowIntegration(currentFolder) {
			const css = vscode.Uri.file(currentFolder + '/css');
			vscode.workspace.fs.createDirectory(css);
			// console.log(css);

      const styles = vscode.Uri.file(currentFolder + '/css/styles.css');
			vscode.workspace.fs.writeFile(styles, new TextEncoder().encode(stylescss));

			const img = vscode.Uri.file(currentFolder + '/img');
			vscode.workspace.fs.createDirectory(img);
			// console.log(img);

			const index = vscode.Uri.file(currentFolder + '/index.html');
			vscode.workspace.fs.writeFile(index, new TextEncoder().encode(indexHTML));
			// console.log(index);

			const main = vscode.Uri.file(currentFolder + '/main.js');
			vscode.workspace.fs.writeFile(main, new TextEncoder().encode(mainJS));
			// console.log(main);

			const manifest = vscode.Uri.file(currentFolder + '/manifest.xml');
			vscode.workspace.fs.writeFile(manifest, new TextEncoder().encode(manifestXML));
			// console.log(manifest);

			const package = vscode.Uri.file(currentFolder + '/package.json');
			vscode.workspace.fs.writeFile(package, new TextEncoder().encode(packageJSON));
			// console.log(package);

			const preload = vscode.Uri.file(currentFolder + '/preload.js');
			vscode.workspace.fs.writeFile(preload, new TextEncoder().encode(preloadJS));
			// console.log(preload);

			const renderer = vscode.Uri.file(currentFolder + '/renderer.js');
			vscode.workspace.fs.writeFile(renderer, new TextEncoder().encode(rendererJS));
			// console.log(renderer);

			const js = vscode.Uri.file(currentFolder + '/js');
			vscode.workspace.fs.createDirectory(js);
			// console.log(js);

			const app = vscode.Uri.file(currentFolder + '/js/app.js');
			vscode.workspace.fs.writeFile(app, new TextEncoder().encode(appJS));
			// console.log(app);

      const NWI = vscode.Uri.file(currentFolder + WIName);
      vscode.workspace.fs.copy(WI, NWI);
		}

    let currentFolder;
		if (!vscode.workspace.workspaceFolders?.length) {
			// vscode.window.showWarningMessage("Open a Folder to Get Started!");
      currentFolder = await pickFolder()
		} else{
      currentFolder = vscode.workspace.workspaceFolders[0].uri.toString(true).slice(8);
    } 
    const currentURI = vscode.Uri.file(currentFolder);
    let panel = vscode.window.createWebviewPanel(
      'workflow',
      'Workflow Integration Setup',
      vscode.ViewColumn.One,
      {enableScripts:true}
    );
    panel.webview.html = getWorkflowContent();
    panel.webview.onDidReceiveMessage(message=>{
      switch(message.command){
        case 'alert':
          vscode.window.showInformationMessage(message.text);
          createProj(message.userName, message.projName, message.description, message.version, message.license);
          createWorkflowIntegration(currentFolder);
          vscode.commands.executeCommand('vscode.openFolder', currentURI, true);
          vscode.commands.executeCommand('workbench.view.explorer');
          panel.dispose();
          return;
        case 'getDefault':
          const folder = path.basename(currentURI.fsPath)
          const username = os.userInfo().username;
          panel.webview.postMessage({ command: 'setDefault', username, folder });
          return;
      }
    })

	});

	context.subscriptions.push(createWorkflow);
	context.subscriptions.push(createScript);
	context.subscriptions.push(openScriptsUserFolder);
	context.subscriptions.push(openScriptsGlobalFolder);
	context.subscriptions.push(openWIFolder);
	context.subscriptions.push(openCurrFolder);
	context.subscriptions.push(downloadOther);
}

function getWorkflowContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<style>
*{
  margin: 0;
  padding: 0;
  color: white;
}

section {
  display: block;
  position: absolute;
  justify-content: space-around;
}

h1 {
  font-size: 2rem;
}

label {
  font-size: 1.3rem;
  margin: 10px 0;
}

input {
  background-color: gray;
  margin: 10px 0;
  font-size: 1.3rem;
  text-align: center;
  border-radius: 5px;
  border: 1px solid transparent;
}

input::placeholder {
  color: lightgray;
}

input:focus {
  color: black;
  background-color: white;
}

#plugin-desc {
  width: 100%;
}
#plugin-ver {
  width: 10%;
}
#plugin-lic {
  width: 10%;
}

button {
  font-size: 1.5rem;
  margin: 10px 0;
  padding: 10px;
  background-color: #0078d4;
  color: white;
  border-radius: 3px;
  border: 1px solid transparent;
}

button:hover {
  cursor: pointer;
  color: white;
  background-color: #026ec1;
}

</style>
<script defer>
const vscode = acquireVsCodeApi();
window.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ command: 'getDefault' });
});

window.addEventListener('message', event => {
    const message = event.data;
    if (message.command === 'setDefault') {
        const userNameBox = document.getElementById('user-name');
        const pluginNameBox = document.getElementById('plugin-name');
        userNameBox.value = message.username;
        pluginNameBox.value = message.folder;
    }
});
</script>
</head>
<body>
<section>
  <h1>Set Up Your Workflow Integration</h1><br><br>
  <label for='user-name'>Your Name/Company Name: </label>
  <input type='text' id='user-name'><br>  
  <label for='plugin-name'>Your Plugin's Name: </label>
  <input type='text' id='plugin-name'><br>
  <label for='plugin-desc'>Your Plugin Description: </label>
  <input type='text' id='plugin-desc' placeholder='Type your one line description here...'><br>
  <label for='plugin-ver'>Your Plugin Version: </label>
  <input type='text' id='plugin-ver' value='1.0.0'><br>
  <label for='plugin-lic'>Your Plugin License: </label>
  <input type='text' id='plugin-lic' value='MIT'><br><br>
  <button onclick="vscode.postMessage({command: 'alert', text: 'Creating Workflow Integration!', userName: document.getElementById('user-name').value, projName: document.getElementById('plugin-name').value, description: document.getElementById('plugin-desc').value, version: document.getElementById('plugin-ver').value, license: document.getElementById('plugin-lic').value})">Create Project</button>
</section>
</body>
</body>
</html>`
}

function getScriptsContent() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<style>
*{
  margin: 0;
  padding: 0;
  color: white;
}

section {
  display: block;
  position: absolute;
  justify-content: space-around;
}

h1 {
  font-size: 2rem;
}

label {
  font-size: 1.3rem;
  margin: 10px 0;
}

/* Dropdown container */
.custom-dropdown {
  background-color: gray;
  margin: 10px 0;
  font-size: 1.3rem;
  text-align: center;
  border-radius: 5px;
  border: 1px solid transparent;
}

/* Displayed selected option */
.dropdown-selected {
    background-color: darkgray;
    // padding: 8px;
    border: 1px solid transparent;
    border-radius: 4px;
    cursor: pointer;
    color: white;
}

/* Hidden list of options */
.dropdown-options {
    cursor: pointer;
    display: none;
    position: absolute;
    width: 100%;
    background-color: gray;
    border: 1px solid transparent;
    border-radius: 4px;
    overflow-y: auto;
    z-index: 1;
}

/* Each option style */
.dropdown-option {
    // padding: 8px;
    cursor: pointer;
    color: white;
}

.dropdown-option:hover {
    background-color: lightgray;
}

/* Show options when active */
.custom-dropdown.active .dropdown-options {
    display: block;
}

input {
  background-color: gray;
  margin: 10px 0;
  font-size: 1.3rem;
  text-align: center;
  border-radius: 5px;
  border: 1px solid transparent;
}

input::placeholder {
  color: lightgray;
}

input:focus {
  color: black;
  background-color: white;
}

#plugin-desc {
  width: 100%;
}
#plugin-ver {
  width: 10%;
}
#plugin-lic {
  width: 10%;
}

button {
  font-size: 1.5rem;
  margin: 10px 0;
  padding: 10px;
  background-color: #0078d4;
  color: white;
  border-radius: 3px;
  border: 1px solid transparent;
}

button:hover {
  cursor: pointer;
  color: white;
  background-color: #026ec1;
}

</style>
<script defer>
const vscode = acquireVsCodeApi();
window.addEventListener('DOMContentLoaded', () => {
    vscode.postMessage({ command: 'getDefault' });
});
</script>
</head>
<body>
<section>
  <h1>Set Up Your Script</h1><br><br>
  <label for='script-name'>Script Name: </label>
  <input type='text' id='script-name'><br>
  <label for='script-type'>Script Folder: </label>
  <div class="custom-dropdown" id="script-type">
      <div class="dropdown-selected" onclick="toggleDropdown('script-type')">Select a Folder</div>
      <div class="dropdown-options"></div>
  </div>
  <label for='script-lang'>Script Language: </label>
  <div class="custom-dropdown" id="script-lang">
      <div class="dropdown-selected" onclick="toggleDropdown('script-lang')">Select a Lang</div>
      <div class="dropdown-options">
          <div class='dropdown-option' onclick='selectOption("Lua", "script-lang")'>Lua</div>
          <div class='dropdown-option' onclick='selectOption("Python", "script-lang")'>Python</div>
      </div>
  </div><br><br>
  <button onclick="vscode.postMessage({command: 'alert', text: 'Creating Script!', name: document.getElementById('script-name').value, folder: document.getElementById('script-type').querySelector('.dropdown-selected').textContent, lang: document.getElementById('script-lang').querySelector('.dropdown-selected').textContent})">Create Project</button>
</section>
<script>
    // Function to toggle dropdown visibility
    function toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        dropdown.classList.toggle('active');
    }

    // Function to add items to the script-type dropdown
    function addItemToScriptType(newItemText) {
        const dropdownOptions = document.getElementById('script-type').querySelector('.dropdown-options');
        
        if (newItemText) {
            const option = document.createElement('div');
            option.className = 'dropdown-option';
            option.textContent = newItemText;
            option.onclick = () => selectOption(newItemText, 'script-type');
            dropdownOptions.appendChild(option);
        }
    }

    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'setDefault') {
        let folders = message.scriptFolders;
        folders.forEach((element) => {
          addItemToScriptType(element);
        });
      }
    });

    // Function to select an option and display it in the selected area
    function selectOption(text, dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const selected = dropdown.querySelector('.dropdown-selected');
        selected.textContent = text;
        dropdown.classList.remove('active');
    }

    // Close dropdown if clicked outside
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.custom-dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });
    });
</script>
</body>
</body>
</html>`
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
