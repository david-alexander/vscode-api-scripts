# VS Code API Scripts extension

This is a VS Code extension with a very simple purpose: to allow you to use the [VS Code Extension API](https://code.visualstudio.com/api/references/vscode-api) without having to write your own extension.

I created it for a specific use case - programmatically generating debug attach configurations - but it may be useful for other things as well.

## Setup

* Install the extension. (You can download the VSIX file from this repo, or build it yourself if you prefer.)
* In the repo / workspace where you want your scripts to run, create a folder called `vscode-api-scripts`. This must be directly under the root folder of the workspace (for a multi-folder workspace, it can be under any or all of the root folders).
* Inside that folder, create one or more files with a `.js` extension. Each of these is a separate script that you can run. See the next section for details on how to write them.

## Writing scripts

The following is an outline of how the scripts are executed and how they are expected to be structured. See the `example-scripts` folder for examples of this.

### Accessing the VS Code Extension API

Scripts are executed in the context of the VS Code API Scripts extension. This means that the script will have access to the VS Code extension API simply by doing `const vscode = require('vscode');`.

### Script structure

Scripts must not use ESM syntax.

Each script must export a method called `run`, which takes no arguments and returns a `Promise` that resolves when the script is done. (If it rejects instead, the error message will be shown to the user.)

### Loading/reloading of the script module.

Every time the script is run, the JS file will be loaded "fresh", using [`import-fresh`](`https://www.npmjs.com/package/import-fresh`). This means that if you make changes to the script and re-run it, the changes will take effect. However, note that the same does not apply to any other modules that your script `require`s.

### Scripts with dependencies

You may load other modules from your script, including from NPM packages etc (bearing in mind the caveat above about reloading).

It is up to you to make sure that these packages are installed so that the script can access them - the extension will not do this for you. The extension will also not set up the Yarn PnP loader for you - it may be possible for your script to set this up itself, but I haven't looked into this.

Therefore, the simplest way to depend on NPM packages is to install them using NPM itself, or something else that creates a compatible `node_modules` folder (e.g. Yarn with the `node-modules` linker).

## Running scripts

To run a script, use one of the following two methods:

* **Method 1:** Hit `Ctrl+Shift+P` and select `VS Code API Scripts: Run Script`. You will be shown a list of all the `*.js` files in your `vscode-api-scripts` folder, and you can choose one of these to run.
* **Method 2:** Open your keybindings file (`Preferences: Open Keyboard Shortcuts (JSON)`), and add a new keybinding similar to the following:

    ```json
    {
        "key": "shift+alt+d", // choose the keybinding you want
        "command": "vscode-api-scripts.runScript",
        "args": "debug-k8s-deployment.js" // put the name of your script file here
    }
    ```

    By passing the name of the script as `args` to the command, you can skip the manual step of selecting a script to run.
    
    You can leave the `args` property out if you just want to create a keybinding to take you to the script selection step.
