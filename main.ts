import {App, Plugin, PluginSettingTab, Setting, TFile, WorkspaceLeaf} from 'obsidian';

interface PluginSettings {
    filename: string;
    questionsTemplate: string;
}

const MARKDOWN_EXTENSION = "md";

const DEFAULT_FILENAME = "RandomStructuralDiaryQuestions";

const DEFAULT_SETTINGS: PluginSettings = {
    filename: null,
    questionsTemplate: ''
}


export default class RandomStructuralDiaryPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        this.addCommand({
            id: 'create-questions-list',
            name: 'Create questions list',

            callback: async () => {

                let file = this.app.vault.getAbstractFileByPath(`${this.settings.filename}.${MARKDOWN_EXTENSION}`);
                if (file instanceof TFile){
                    let fileContent = await this.app.vault.cachedRead(file);
                    await this.fillFileWithQuestions(fileContent);
                }
                else {
                    const pathToDefaultFile = this.manifest.dir + `/${DEFAULT_FILENAME}.${MARKDOWN_EXTENSION}`;
                    let defaultFile = await this.app.vault.adapter.read(pathToDefaultFile);
                    await this.fillFileWithQuestions(defaultFile);
                }
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

    private async fillFileWithQuestions(fileContent: string) {
        let sections = this.getSections(fileContent);
        let questionsSettings = this.parseQuestionSettings();
        let questions = sections.map(x => {
            let numOfQuestions = questionsSettings.get(sections.indexOf(x) + 1);
            if (!numOfQuestions)
                numOfQuestions = this.getRandomInt(x.length);

            return this.generateRandomQuestionsFromSection(x, numOfQuestions);
        }, this);

        let flattenQuestions = questions.reduce((acc, val) => acc.concat(val), []);

        let outputString = flattenQuestions.join("\n\n\n");

        let activeFile = this.app.workspace.getActiveFile();
        if(!activeFile || activeFile.extension !== MARKDOWN_EXTENSION){
            let fileName = `RandomDiaryQuestions by ${this.getFancyDate()}.${MARKDOWN_EXTENSION}`;
            activeFile = await this.app.vault.create(fileName, outputString);
        }
        else {
            let userContent = await this.app.vault.cachedRead(activeFile);
            outputString = userContent + '\n\n' + outputString;
            await this.app.vault.modify(activeFile, outputString);
        }

        let leaf = this.app.workspace.getMostRecentLeaf();
        if(!leaf){
            let leaf = new WorkspaceLeaf();
            this.app.workspace.createLeafBySplit(leaf);
        }

        await leaf.openFile(activeFile);
    }

    /**
     * Creates array of sections with questions without headers
     * @param content
     */
    private getSections(content: string): string[][] {
        let headerSymbol = "# ";
        let splitedHeaders = content.split(headerSymbol);

        let sections: string[][] = [];
        for (let i = 0; i < splitedHeaders.length; i++) {
            let currentSection = splitedHeaders[i];
            let result = currentSection.split("\n");

            result = result.filter(x => x.trim().length > 0);
            result.shift();
            if (result.length)
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
    private generateRandomQuestionsFromSection(section: string[], numOfQuestions: number): string[] {
        if (numOfQuestions >= section.length)
            return section;
        if (numOfQuestions === 0)
            return [];

        let result = [];

        for (let i = 0; i < numOfQuestions; i++) {
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
    private getRandomQuestion(questions: string[]): string {
        let randomNumber = this.getRandomInt(questions.length);
        return questions[randomNumber];
    }

    /**
     * Prepare settings for using
     * @private
     */
    private parseQuestionSettings(): Map<number, number> {
        let result: Map<number, number> = new Map<number, number>();

        if (!this.settings.questionsTemplate)
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

    private getFancyDate(): string{
        let date = new Date();
        let fancyDate = `${date.getDay() + 1}-${date.getMonth() + 1}-${date.getFullYear()}`
        return fancyDate;
    }
}

class SampleSettingTab
    extends PluginSettingTab {
    plugin: RandomStructuralDiaryPlugin;

    constructor(app: App, plugin: RandomStructuralDiaryPlugin) {
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
