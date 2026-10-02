#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import * as dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { initCommand } from './application/commands/InitCommand.js';
import { updateCommand } from './application/commands/UpdateCommand.js';
import { GenerateCommand } from './application/commands/GenerateCommand.js';
import { showProfileCommand, editProfileCommand } from './application/commands/ProfileCommand.js';
import { DomainError } from './domain/errors/DomainError.js';
import { GroqAI } from './infrastructure/ai/GroqAI.js';
import { GeminiAI } from './infrastructure/ai/GeminiAI.js';
import { OpenAIProvider } from './infrastructure/ai/OpenAI.js';
import { AnthropicAI } from './infrastructure/ai/AnthropicAI.js';
import { OllamaAI } from './infrastructure/ai/OllamaAI.js';
import { InquirerGeneratedCVReview } from './infrastructure/confirmation/InquirerGeneratedCVReview.js';
import { NodeFileWriter } from './infrastructure/files/NodeFileWriter.js';
import { PDFGenerator } from './infrastructure/pdf/PDFGenerator.js';
import { ReadlineGeneratePrompts } from './infrastructure/prompts/ReadlineGeneratePrompts.js';
import { JSONProfileRepository } from './infrastructure/repositories/JSONProfileRepository.js';
import type { IAIProvider } from './interfaces/IAIProvider.js';

dotenv.config();

function createAIProviderFactory(): () => IAIProvider {
  return () => {
    const provider = process.env.ACTIVE_PROVIDER || 'groq';

    switch (provider) {
      case 'groq':
        return new GroqAI();
      case 'gemini':
        return new GeminiAI();
      case 'openai':
        return new OpenAIProvider();
      case 'anthropic':
        return new AnthropicAI();
      case 'ollama':
        return new OllamaAI();
      default:
        throw new DomainError(
          `Unknown provider: ${provider}`,
          'AI_ERROR',
          'Set ACTIVE_PROVIDER to: groq, gemini, openai, anthropic, or ollama',
        );
    }
  };
}

const generateCommand = new GenerateCommand(
  new JSONProfileRepository(),
  createAIProviderFactory(),
  new InquirerGeneratedCVReview(),
  new ReadlineGeneratePrompts(),
  new PDFGenerator(),
  new NodeFileWriter(),
);

const program = new Command();
const { version } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

program
  .name('cv')
  .description('CV Adapter - Generate tailored CVs from job vacancies')
  .version(version);

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
  .option('--yes', 'Replace the profile without interactive confirmation')
  .action(async (opts) => {
    await updateCommand.execute(opts.pdf, opts.lang, { yes: opts.yes });
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
  .option('--edit', 'Edit profile in $EDITOR through a staged file')
  .option('--yes', 'Replace the profile without interactive confirmation')
  .action(async (opts) => {
    if (opts.show) {
      await showProfileCommand.execute();
    } else if (opts.edit) {
      await editProfileCommand.execute({ yes: opts.yes });
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

try {
  await program.parseAsync();
} catch {
  process.exitCode = 1;
}
