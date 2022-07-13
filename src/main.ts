import * as core from '@actions/core'
import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const paths = core.getMultilineInput('paths', {required: true})

    // printing the list of paths provided
    core.debug('List of provided paths:')
    for (const path of paths) {
      core.debug(path)
    }

    const hashset: Set<string> = new Set<string>()

    // Get git hashes for each folder/file from the input parameters
    for (const path of paths) {
      const result = await exec.getExecOutput('git', [
        'log',
        '--pretty=format:"%H"',
        '-n1',
        path
      ])
      if (!hashset.has(result.stdout)) {
        hashset.add(result.stdout)
      }
    }

    // printing the list of paths provided
    core.debug('List of sha paths:')
    for (const sha of hashset) {
      core.debug(sha)
    }

    const result = await exec.getExecOutput(
      'str=$((for c; do git log --all --merges --ancestry-path ^$c --pretty=\'%aI %H %s\'; done ) | sort | uniq -c | awk "\\$1 == $# {print;exit}");arr=(${str});echo ${arr[2]}',
      Array.from(hashset)
    )

    core.setOutput('youngest', result.stdout)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
