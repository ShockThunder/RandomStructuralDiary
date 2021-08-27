import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

const NUM_OF_QUESTIONS = 2;

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addStatusBarItem().setText('Status Bar Text');

		this.addCommand({
			id: 'open-sample-modal',
			name: 'Open Sample Modal',

			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						let tt = this.app.vault.getMarkdownFiles().find(x => x.name.contains("StructureDiaryQuestions"));
						this.app.vault.read(tt).then(result =>
							{
								let sections = this.getSections(result);
								let questions = sections.map(x => this.generateRandomQuestionsFromSection(x, NUM_OF_QUESTIONS), this);
								let flattenQuestions = questions.reduce((acc, val) => acc.concat(val), []);

								let outputString = flattenQuestions.join("\n\n\n");

								let file = this.app.workspace.getActiveFile();
								this.app.vault.modify(file, outputString);
							}
						);
					}
					return true;
				}
				return false;
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));
	}

	onunload() {
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	/**
	 * Creates array of sections with questions without headers
	 * @param content
	 */
	private getSections(content: string): string[][]{
		let headerSymbol="# ";
		let splitedHeaders = content.split(headerSymbol);

		let sections: string[][] = [];
		for (let i = 0; i < splitedHeaders.length; i++){
			let currentSection = splitedHeaders[i];
			let result = currentSection.split("\n");

			result = result.filter(function(e){return e});
			result.shift();

			if(result.length)
				sections.push(result);
		}

		return sections;
	}

	/**
	 * Returns random int from 0 to max
	 * @param max int top border
	 * @private
	 */
	private getRandomInt(max: number): number {
		return Math.floor(Math.random() * max);
	}

	/**
	 * Create array of random questions
	 * @param section questions section
	 * @param numOfQuestions number of generated questions
	 * @private
	 */
	private generateRandomQuestionsFromSection(section: string[], numOfQuestions: number): string[]{
		if(numOfQuestions >= section.length)
			return section;
		if(numOfQuestions === 0)
			return [];

		let result = [];

		for(let i = 0; i < numOfQuestions; i++){
			let question = this.getRandomQuestion(section);
			section.remove(question);
			result.push(question);
		}

		return result;
	}

	/**
	 * Returns random question from array
	 * @param questions question array
	 * @private
	 */
	private getRandomQuestion(questions: string[]): string{
		let randomNumber = this.getRandomInt(questions.length);
		return questions[randomNumber];
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
