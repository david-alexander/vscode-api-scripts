import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import importFresh from 'import-fresh';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('vscode-api-scripts.runScript', async (scriptName?: string) => {
		const allScripts: { filename: string, path: string }[] = [];

		for (const workspaceFolder of (vscode.workspace.workspaceFolders || []))
		{
			const scriptsFolder = path.join(workspaceFolder.uri.fsPath, 'vscode-api-scripts');

			try
			{
				const scripts = (await fs.promises.readdir(scriptsFolder))
								.filter(filename => filename.endsWith('.js'))
								.map(filename => ({ filename, path: path.join(scriptsFolder, filename) }));
				allScripts.push(...scripts);
			}
			catch (e)
			{

			}
		}

		let selectedScript: typeof allScripts[0];

		if (scriptName)
		{
			const script = allScripts.find(script => script.filename === scriptName);

			if (!script)
			{
				vscode.window.showErrorMessage(`No script found with name ${scriptName}.`);
				return;
			}

			selectedScript = script;
		}
		else
		{
			const selection = await vscode.window.showQuickPick(allScripts.map(script => ({ label: script.filename, script })), {
				title: 'Select a script to run...'
			});

			if (!selection)
			{
				return;
			}

			selectedScript = selection.script;
		}

		try
		{
			const scriptModule: any = importFresh(selectedScript.path);
			await scriptModule.run();
		}
		catch (e)
		{
			vscode.window.showErrorMessage(`Script ${selectedScript.filename} failed with error ${e}`);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
