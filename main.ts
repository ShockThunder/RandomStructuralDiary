import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		console.log('loading plugin');

		await this.loadSettings();

		this.addRibbonIcon('dice', 'Sample Plugin', () => {
			new Notice('This is a notice!');
		});

		this.addStatusBarItem().setText('Status Bar Text');

		this.addCommand({
			id: 'open-sample-modal',
			name: 'Open Sample Modal',
			// callback: () => {
			// 	console.log('Simple Callback');
			// },
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						let tt = this.app.vault.getMarkdownFiles().find(x => x.name.contains("StructureDiaryQuestions"));
						this.app.vault.read(tt).then(result =>
							{
								let questions = this.splitByHeaders(result);
								console.log(questions)

								let outputString = "";

								for(let i = 0; i < questions.length; i++){
									outputString = outputString + "\n" + questions[i].join("\n");
								}
								let file = this.app.workspace.getActiveFile();
								this.app.vault.modify(file, outputString);
							}
						);
						console.log(tt);
					}
					return true;
				}
				return false;
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerCodeMirror((cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
		});

		// this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		// 	console.log('click', evt);
		// });

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	splitByHeaders(content: string): string[][]{
		let headerSymbols="# ";
		let splitedHeaders = content.split(headerSymbols);
		let questions: string[][] = [];
		for (let i = 0; i < splitedHeaders.length; i++){
			let curr = splitedHeaders[i];
			let curQs = curr.split("\n");
			let rawResult = [];
			for(let j = 1; j < curQs.length; j++){
				if(curQs[j])
					rawResult.push(curQs[j]);
			}

			if(rawResult.length > 0){
				let result = [];

				result.push(rawResult[this.getRandomInt(rawResult.length)]);
				result.push(rawResult[this.getRandomInt(rawResult.length)]);

				if(result.length > 0)
					questions.push(result);
			}
		}

		return questions;
	}

	getRandomInt(max: number): number {
		return Math.floor(Math.random() * max);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		let {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
