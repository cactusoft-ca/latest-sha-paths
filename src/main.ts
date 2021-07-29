import * as core from '@actions/core'
import * as exec from '@actions/exec'

import {wait} from './wait'

async function run(): Promise<void> {
  try {

    const paths = core.getMultilineInput('paths', { required: true });


    // printing the list of paths provided
    core.debug('List of provided paths:')
    for (let path of paths) {
      core.debug(path)
    }

    let myOutput = '';
    let myError = '';

    // printing the sha of each path
    for (let path of paths) {
      const options = {
        listeners: {
          stdout: (data: Buffer) => {
            myOutput += data.toString();
          },
          stderr: (data: Buffer) => {
            myError += data.toString();
          }
        }
      };

      await exec.exec('git', ['log', '--pretty=format:"%H"', '-n1', path], options);
      core.debug(myOutput)
      core.info(myOutput)
      console.log(myOutput);
      console.log(myError);
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
