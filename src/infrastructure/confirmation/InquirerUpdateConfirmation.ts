import inquirer from 'inquirer';
import type { UpdateConfirmation } from '../../interfaces/UpdateConfirmation.js';

export class InquirerUpdateConfirmation implements UpdateConfirmation {
  isInteractive(): boolean {
    return process.stdin.isTTY === true;
  }

  async confirm(message: string): Promise<boolean> {
    const answer = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: false,
      },
    ]);
    return answer.confirmed;
  }
}
