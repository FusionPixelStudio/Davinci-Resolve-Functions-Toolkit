// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

const { exec } = require('child_process');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {

  const os = require('os');
  const username = os.userInfo().username;

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

  const openScriptsUserFolder = vscode.commands.registerCommand('davinci-resolve-function-toolkit.openScriptsUserFolder', async function () {
    let scriptsPath;
    if (process.platform === "darwin") {
      scriptsPath = `/Users/${username}/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts`;
    } else if (process.platform === "win32") {
      scriptsPath = `C:\\Users\\${username}\\AppData\\Roaming\\Blackmagic Design\\DaVinci Resolve\\Support\\Fusion\\Scripts`;
    } else {
      scriptsPath =  `/home/${username}/.local/share/DaVinciResolve/Fusion/Scripts`
    }
    const scripts = vscode.Uri.file(scriptsPath)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find User DVR Scripts Folder!\n" + scriptsPath);
      return;
    }
    openFolderInExplorer(scriptsPath)
  });
  const openScriptsGlobalFolder = vscode.commands.registerCommand('davinci-resolve-function-toolkit.openScriptsGlobalFolder', async function () {
    let scriptsPath;
    if (process.platform === "darwin") {
      scriptsPath = `/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts`;
    } else if (process.platform === "win32") {
      scriptsPath = `C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Fusion\\Scripts`;
    } else {
      scriptsPath =  `/opt/resolve/Fusion/Scripts`
    }
    const scripts = vscode.Uri.file(scriptsPath)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find Global DVR Scripts Folder!\n" + scriptsPath);
      return;
    }
    openFolderInExplorer(scriptsPath)
  });
  const openWIFolder = vscode.commands.registerCommand('davinci-resolve-function-toolkit.openWIFolder', async function () {
    let path;
    if (process.platform === "darwin") {
      path = `/Library/Application Support/Blackmagic Design/DaVinci Resolve/Support/Workflow Integration Plugins`;
    } else if (process.platform === "win32") {
      path = `C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\Workflow Integration Plugins`;
    } else {
      path =  `/opt/resolve/Support/Workflow Integration Plugins`
    }
    const scripts = vscode.Uri.file(path)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find Global DVR Scripts Folder!\n" + path);
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
    if (process.platform === "darwin") {
      scriptsPath = `/Users/${username}/Library/Application Support/Blackmagic Design/DaVinci Resolve/Fusion/Scripts`;
    } else if (process.platform === "win32") {
      scriptsPath = `C:\\Users\\${username}\\AppData\\Roaming\\Blackmagic Design\\DaVinci Resolve\\Support\\Fusion\\Scripts`;
    } else {
      scriptsPath =  `/home/${username}/.local/share/DaVinciResolve/Fusion/Scripts`
    }
    const scripts = vscode.Uri.file(scriptsPath)
    const exists = await fileExists(scripts);
    if (!exists) {
      vscode.window.showErrorMessage("Could Not Find DVR Scripts Folder!\n" + scriptsPath);
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

	const createWorkflow = vscode.commands.registerCommand('davinci-resolve-function-toolkit.createWorkflow', function () {

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

		mainJS = `const {app, BrowserWindow, ipcMain, shell, Menu} = require('electron')
const path = require('path');

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

    // win.webContents.openDevTools();

    // hide the menu bar
    win.setMenuBarVisibility(false);

    win.on('close', function(e) {
        app.quit();
    });

    win.once('ready-to-show', () => win.show())

    win.loadFile("index.html");
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});


// Expose Access to Modules
ipcMain.handle('path-join', (event, ...paths) => path.join(...paths));
ipcMain.handle('path-basename', (event, filePath) => path.basename(filePath));
ipcMain.handle('path-dirname', (event, filePath) => path.dirname(filePath));
ipcMain.handle('path-extname', (event, filePath) => path.extname(filePath));

ipcMain.handle('get-dirname', () => __dirname);`

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

contextBridge.exposeInMainWorld('electronAPI', {
  // Expose path functions
  pathJoin: (...args) => ipcRenderer.invoke('path-join', ...args),
  pathBasename: (filePath) => ipcRenderer.invoke('path-basename', filePath),
  pathDirname: (filePath) => ipcRenderer.invoke('path-dirname', filePath),
  pathExtname: (filePath) => ipcRenderer.invoke('path-extname', filePath),
  getDirname: () => ipcRenderer.invoke('get-dirname'),
});

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

		appJS = `const cssFolderPromise = (async () => {
    const dirname = await window.electronAPI.getDirname();
    return window.electronAPI.pathJoin(dirname, 'css/');
})();

async function getCSSFolder() {
    return await cssFolderPromise;
}

async function something() {
    const cssFolder = await getCSSFolder();
    console.log(cssFolder);
}

something();`
    }

    let WIFolder
    let WIName
		if (process.platform === "darwin") {
			WIFolder = '/Library/Application Support/Blackmagic Design/DaVinci Resolve/Developer/Workflow Integrations/Examples/SamplePlugin/WorkflowIntegration.node'
      WIName = '/WorkflowIntegration_Mac.node'
		} else if (process.platform === "win32") {
			WIFolder = 'C:\\ProgramData\\Blackmagic Design\\DaVinci Resolve\\Support\\Developer\\Workflow Integrations\\Examples\\SamplePlugin\\WorkflowIntegration.node'
      WIName = '/WorkflowIntegration_Win.node'
		} else {
      vscode.window.showErrorMessage("Workflow Integrations Not Supported on Linux!");
      return
    }

    const WI = vscode.Uri.file(WIFolder);
    fileExists(WI).then(exists => {
      if (!exists) {  
        vscode.window.showErrorMessage("Workflow Integration File Could Not be Retrieved!\n" + WIFolder);
        return
      }
    });

		function createWorkflowIntegration(currentFolder) {
			const css = vscode.Uri.file(currentFolder + '/css');
			vscode.workspace.fs.createDirectory(css);
			// console.log(css);

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

		if (!vscode.workspace.workspaceFolders?.length) {
			vscode.window.showWarningMessage("Open a Folder to Get Started!");
		} else {
      const currentFolder = vscode.workspace.workspaceFolders[0].uri.toString(true).slice(8);
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
            vscode.commands.executeCommand('workbench.view.explorer');
            panel.dispose();
            return;
          case 'getDefault':
            const folder = vscode.workspace.workspaceFolders[0].name
            panel.webview.postMessage({ command: 'setDefault', username, folder });
            return;
        }
      })
		}

	});

	context.subscriptions.push(createWorkflow);
	context.subscriptions.push(createScript);
	context.subscriptions.push(openScriptsUserFolder);
	context.subscriptions.push(openScriptsGlobalFolder);
	context.subscriptions.push(openWIFolder);
	context.subscriptions.push(openCurrFolder);
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
