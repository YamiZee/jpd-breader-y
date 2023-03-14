import { promisify } from 'node:util';
import childProcess from 'node:child_process';
import console from 'node:console';
const exec = promisify(childProcess.exec);

// prettier API is very lacking, we'll just call the CLI directly

export async function check() {
    try {
        await exec('npx prettier -c .');
        return 0;
    } catch (error) {
        console.log(error.stderr);
        return error.stderr.match(/^\[warn\] /gm).length - 1;
    }
}

export async function format() {
    try {
        const { stdout, stderr } = await exec('npx prettier -w .');
        console.log(stdout);
        console.log(stderr);
        return true;
    } catch (error) {
        console.log(error.stderr);
        return false;
    }
}
