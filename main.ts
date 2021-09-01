import {App, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';

interface MyPluginSettings {
	filename: string;
	questionsTemplate: string;
}
const DEFAULT_FILENAME = "RandomStructuralDiaryQuestions";

const DEFAULT_SETTINGS: MyPluginSettings = {
	filename: DEFAULT_FILENAME,
	questionsTemplate: ''
}




export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'create-questions-list',
			name: 'Create questions list',

			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						let file = this.app.vault.getMarkdownFiles().find(x => x.name === `${this.settings.filename}.md`);
						if(!file){
							const pathToDefaultFile = this.manifest.dir + `/${DEFAULT_FILENAME}.md`;
							const adapter = this.app.vault.adapter;
							adapter.read(pathToDefaultFile).then(result => {
								let filename = this.settings.filename == '' ? DEFAULT_FILENAME : this.settings.filename;
								this.app.vault.create(`${filename}.md`, result)
									.then(createdFile => {
										this.fillFileWithQuestions(createdFile);
									});
							});
						}
						else {
							this.fillFileWithQuestions(file);
						}

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

	private fillFileWithQuestions(file: TFile): void{
		this.app.vault.read(file).then(result =>
			{
				let sections = this.getSections(result);
				let questionsSettings = this.parseQuestionSettings();
				let questions = sections.map(x => {
					let numOfQuestions = questionsSettings.get(sections.indexOf(x) + 1);
					if(!numOfQuestions)
						numOfQuestions = this.getRandomInt(x.length);

					return this.generateRandomQuestionsFromSection(x, numOfQuestions);
				}, this);
				let flattenQuestions = questions.reduce((acc, val) => acc.concat(val), []);

				let outputString = flattenQuestions.join("\n\n\n");

				let file = this.app.workspace.getActiveFile();
				this.app.vault.modify(file, outputString);
			}
		);
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

	/**
	 * Prepare settings for using
	 * @private
	 */
	private parseQuestionSettings(): Map<number, number>{
		let result: Map<number, number> = new Map<number, number>();

		if(!this.settings.questionsTemplate)
			return result;

		let splitedSettings = this.settings.questionsTemplate.split(';');
		splitedSettings.map(x => {
			let splitedValues = x.split('-');
			let sectionNumber = splitedValues[0];
			let numberOfQuestions = splitedValues[1];

			result.set(Number(sectionNumber), Number(numberOfQuestions));
		})

		return result;
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
				.addText(text => text
					.setPlaceholder('FileName')
					.setValue(this.plugin.settings.filename)
					.onChange(async (new_filename) => {
						this.plugin.settings.filename = new_filename;
						await this.plugin.saveSettings();
					}));

			new Setting(containerEl)
				.setName('Questions Template')
				.setDesc('Format: section1-numberOfQuestions;section1-numberOfQuestions; 1-3;2-2;...\n If section not specified picks random number of questions')
				.addText(text => text
					.setPlaceholder('1-3;2-2;')
					.setValue(this.plugin.settings.questionsTemplate)
					.onChange(async (new_template) => {
						this.plugin.settings.questionsTemplate = new_template;
						await this.plugin.saveSettings();
					}));
		}
}
