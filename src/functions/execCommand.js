import { exec } from 'child_process';

/**
 * Executes a shell command and returns it as a Promise.
 * @param {string} cmd - The command to execute.
 * @returns {Promise<string>} - A promise that resolves with the command's output.
 */
export default async function execCommand(cmd) {
    return await new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Stderr: ${stderr}`);
                return;
            }
            resolve(stdout);
        });
    });
};