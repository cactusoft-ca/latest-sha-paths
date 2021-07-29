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



    let listOfSha: Array<string> = new Array<string>()
    let listGetShaError: Array<string> = new Array<string>()

    // printing the sha of each path
    for (let path of paths) {

      let sha = '';
      let getShaError = '';

      const options = {
        listeners: {
          stdout: (data: Buffer) => {
            sha += data.toString();
          },
          stderr: (data: Buffer) => {
            getShaError += data.toString();
          }
        }
      };

      await exec.exec('git', ['log', '--pretty=format:"%H"', '-n1', path], options);
      core.debug(sha)
      listOfSha.push(sha)
      console.log(getShaError);
      listGetShaError.push(getShaError)
    }

    // printing the list of paths provided
    core.info('List of sha paths:')
    for (let sha of listOfSha) {
      core.debug(sha)
    }

    // printing the list of errors if any
    if(listGetShaError.length > 0){
      core.error(`${listGetShaError.length} Errors encountered trying to get sha from paths`)
      var errorMessage = '';

      for (let error of listGetShaError) {
        errorMessage += error + '\n'
      }
      throw new Error(errorMessage)

    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
