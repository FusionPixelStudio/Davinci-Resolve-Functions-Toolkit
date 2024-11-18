# Davinci Resolve ToolKit

Make projects faster with Snippets and Project Creating Automation!

This extension contains code snippets for Lua, Python, and Javascript for [Vs Code][code] editor.

---

# Features

Auto Complete Functions from the Davinci Resolve APIs! Get all the functions for the Resolve API, BMD Functions API, and Fusion UI API! Full Fusion API coming soon!

Autofill in 3 Languages! Lua, Python, and Javascript!

Or Use the Project Creators to make a Script or Workflow Integration Template! Check out the custom tab to get started!

---

## Sidebar

**Create Python and Lua Scripts!**
![scripts-creator](images/scripts-creator.gif)

**Create Workflow Integrations!**
![wi-creator](images/wi-creator.gif)

**Navigate to Folders!**
![navigate](images/navigate.gif)

**Get Quick Help!**
![help](images/help.gif)

---

## Snippets

![snippets](images/snippets.gif)

All APIs are filled with every function and options that are commonly used. These are just predictive as you type, but there are also a handful of "snippets" to auto fill your code!

**Note: All snippets include the variable before the function. For example:**

```lua
resolve:GetProjectManager()
```

**The snippets below call variables as well. For example:**

```lua
local resolve = app:GetResolve()
local projectManager = resolve:GetProjectManager()
```

### Resolve API

|             Trigger             | Content                                                                                                                       |
| :-----------------------------: | :---------------------------------------------------------------------------------------------------------------------------- |
|              `rs`               | Fills with the Resolve Starting Point Objects: `Resolve, ProjectManager, Project, MediaStorage, MediaPool, Timeline, Gallery` |
| `ws` <small>_(JS ONLY)_</small> | Fills with the Workflow Integration Initialize setup                                                                          |

### Fusion API <small>_Not in JS_</small>

| Trigger | Content                                                              |
| :-----: | :------------------------------------------------------------------- |
|  `fs`   | Fills with the Fusion Starting Point Objects: `Fusion, Current Comp` |

### Fusion GUI API <small>_Not in JS_</small>

| Trigger | Content                                                                                                                  |
| :-----: | :----------------------------------------------------------------------------------------------------------------------- |
|  `ui`   | Fills with GUI template with variables, close function, showing and run loop - IS RESIZABLE, REQUIRES X,Y POS            |
|  `fui`  | Fills with GUI template with variables, close function, showing and run loop - HAS A FIXED SIZE, POS AT CENTER OF SCREEN |

### BMD Functions API <small>_Not in JS_</small>

**NO FULL SNIPPETS YET**

---

# Extension Settings

- `davinci-resolve-function-toolkit.UserScriptsPath`: Where are your Davinci Resolve User Scripts stored?
- `davinci-resolve-function-toolkit.GlobalScriptsPath`: Where are your Davinci Resolve Global Scripts stored?
- `davinci-resolve-function-toolkit.WorkflowIntegrationPath`: Where are your Davinci Resolve Workflow Integration Plugins stored?

---

# Requirements

Either [Fusion](https://www.blackmagicdesign.com/products/fusion/) and/or [Davinci Resolve](https://www.blackmagicdesign.com/products/davinciresolve/) and [VScode](https://code.visualstudio.com/download)

---

# Known Issues

- Missing Fusion API Snippets
- 🤞Hopefully that's it

---

# Release Notes

### 1.5.2

- Fixed Mac bug when getting Workflow Integration Node

### 1.5.0

- Added Settings for Script And Workflow Integration Paths - auto sets when extension loads
- Updated Buttons to use Setting Paths
- Updated Python and JS Snippets

### 1.0.0

#### Initial release of the Davinci Resolve Functions Toolkit

- Added Resolve API Functions snippets in Lua, Python, and JS
- Added Fusion UI Functions, Elements, and Window Startup Templates snippets in Lua and Python
- Added BMD Functions snippets in Lua and Python
- Added Buttons to open folders for Scripting and Workflow Integrations
- Added Buttons to open websites for the APIs documentation
- Added Workflow Integration Creator
- Added Script Creator

[code]: https://code.visualstudio.com/
