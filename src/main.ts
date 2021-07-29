import * as core from '@actions/core'
import {wait} from './wait'

async function run(): Promise<void> {
  try {

    const paths = core.getMultilineInput('paths', { required: true });

    for (let path of paths) {
      core.debug(path)
    }

  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
