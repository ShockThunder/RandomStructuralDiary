import { App, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	filename: string;
}
const DEFAULT_FILENAME = "RandomStructuralDiaryQuestions";

const DEFAULT_SETTINGS: MyPluginSettings = {
	filename: DEFAULT_FILENAME
}

const NUM_OF_QUESTIONS = 2;



export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addStatusBarItem().setText('Status Bar Text');

		this.addCommand({
			id: 'create-questions-list',
			name: 'Create questions list',

			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						let file = this.app.vault.getMarkdownFiles().find(x => x.name.contains(this.settings.filename));
						if(!file){
							const pathToDefaultFile = this.manifest.dir + `/${DEFAULT_FILENAME}.md`;
							const adapter = this.app.vault.adapter;
							adapter.read(pathToDefaultFile).then(result => {
								console.log(this.settings);
								this.app.vault.create(`${this.settings.filename}.md`, result)
									.then(createdFile => {
										file = createdFile;
									});
							});
						}
						this.app.vault.read(file).then(result =>
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

			result = result.filter(x => x.trim().length > 0);
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

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for RandomStructuralDiary plugin.'});

			new Setting(containerEl)
				.setName('Path to questions file')
				.setDesc('Path to questions file')
				.addText(text => text
					.setPlaceholder(DEFAULT_FILENAME)
					.setValue(DEFAULT_FILENAME)
					.onChange(async (value) => {
						this.plugin.settings.filename = value;
						await this.plugin.saveSettings();
					}));
		}
}
