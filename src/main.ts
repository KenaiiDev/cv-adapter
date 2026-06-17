#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import { initCommand } from './application/commands/InitCommand.js';
import { updateCommand } from './application/commands/UpdateCommand.js';
import { generateCommand } from './application/commands/GenerateCommand.js';
import { showProfileCommand, editProfileCommand } from './application/commands/ProfileCommand.js';

const program = new Command();

program
  .name('cv')
  .description('CV Adapter - Generate tailored CVs from job vacancies')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize profile from a PDF CV')
  .requiredOption('--pdf <path>', 'Path to PDF file')
  .option('--lang <es|en>', 'Language of the CV', 'es')
  .action(async (opts) => {
    await initCommand.execute(opts.pdf, opts.lang);
  });

program
  .command('update')
  .description('Update profile from a new PDF')
  .requiredOption('--pdf <path>', 'Path to PDF file')
  .option('--lang <es|en>', 'Language of the CV', 'es')
  .action(async (opts) => {
    await updateCommand.execute(opts.pdf, opts.lang);
  });

program
  .command('generate')
  .description('Generate a tailored CV for a job vacancy')
  .argument('<vacancy>', 'Job vacancy description')
  .option('--lang <es|en>', 'Language for the output CV')
  .action(async (vacancy, opts) => {
    await generateCommand.execute(vacancy, opts.lang);
  });

program
  .command('profile')
  .description('View or edit the current profile')
  .option('--show', 'Show current profile')
  .option('--edit', 'Edit profile in $EDITOR')
  .action(async (opts) => {
    if (opts.show) {
      await showProfileCommand.execute();
    } else if (opts.edit) {
      await editProfileCommand.execute();
    } else {
      await showProfileCommand.execute();
    }
  });

program
  .command('interactive')
  .alias('i')
  .description('Run in interactive mode')
  .action(async () => {
    console.log('\n╔═══════════════════════════════════════╗');
    console.log('║           CV ADAPTER                   ║');
    console.log('╚═══════════════════════════════════════╝\n');

    const { option } = await inquirer.prompt([
      {
        type: 'list',
        name: 'option',
        message: 'Select an option:',
        choices: [
          'Generate CV for vacancy',
          'View current profile',
          'Update profile from PDF',
          'Edit profile manually',
          'Exit',
        ],
      },
    ]);

    switch (option) {
      case 'Generate CV for vacancy': {
        const { vacancy } = await inquirer.prompt([
          {
            type: 'input',
            name: 'vacancy',
            message: 'Paste the job vacancy description:',
          },
        ]);
        await generateCommand.execute(vacancy);
        break;
      }
      case 'View current profile':
        await showProfileCommand.execute();
        break;
      case 'Update profile from PDF': {
        const { pdfPath } = await inquirer.prompt([
          {
            type: 'input',
            name: 'pdfPath',
            message: 'Enter path to PDF:',
          },
        ]);
        await updateCommand.execute(pdfPath);
        break;
      }
      case 'Edit profile manually':
        await editProfileCommand.execute();
        break;
      case 'Exit':
        console.log('👋 Goodbye!');
        break;
    }
  });

program.parse();