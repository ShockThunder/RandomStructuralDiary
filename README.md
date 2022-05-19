## Random Structural Diary Questions
Answer on random questions of your diary to get new thoughts;
This plugin use a prepared list of questions if you doesn't have one.
There is the list - https://zttl.wiki/Structural-diary-b5ecbe5e0dd643b1a868bd773b34094b
### Update 1.1.0
Now by default plugin picks number of question from the whole file.
You can change this behaviour to old style in plugin settings.

You can setup your own questions for example
```markdown
    #Section1
        Question1
        Question2
        Question3
    #Section2
        Question1
        Question2
        Question3
    #Section3
        Question1
        Question2
        Question3
```
And fill this filename in plugin settings.
It's important to keep section headers as # headers.
Also questions separated by linebrakes `\n`. So, please write your questions
by one at line.

Also you can setup number of questions from each section.
Use the template 
`sectionNumber-numberOfQuestions;sectionNumber-numberOfQuestions;`
Like `1-3;2-2;4-0` - it takes three questions from first section, two from second and zero from fourth;
If section ommited then number of questions picks randomly (it can be 0);

To use plugin create a new file and execute command
`Create questions list`

Release 1.0.6
 - Add support for questions files in folders
 - Add autofill for filename
 - Add option to show or hide section headers
Release 1.1.0.
 - Add global question picking feature

