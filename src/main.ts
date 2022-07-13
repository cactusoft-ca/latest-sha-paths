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
        hashset.add(replaceAll(replaceAll(result.stdout, '"', ''), "'", ''))
      }
    }

    // printing the list of paths provided
    core.debug('List of sha paths:')
    for (const sha of hashset) {
      core.debug(sha)
    }

    const hashesList = []

    for (const sha of hashset) {
      const result = await exec.getExecOutput(
        'git',
        ['log', '--ancestry-path', `${sha}...HEAD`, "--pretty='%H'"],
        {silent: true}
      )

      const hashes = result.stdout
        .split(/\r?\n/)
        .map(x => replaceAll(replaceAll(x, '"', ''), "'", ''))
        .filter(x => x)

      hashes.push(sha)
      hashesList.push(hashes)
    }

    const smallestLength = Math.min(...hashesList.map(x => x.length))
    let commonHash

    for (let i = 0; i < smallestLength; i++) {
      const values = hashesList.map(x => x[i])
      const distinctValues = [...new Set(values)]
      if (distinctValues.length !== 1) {
        core.debug(
          `Found distinct hash value: ${JSON.stringify(distinctValues)}`
        )
        break
      } else {
        core.debug(`Setting common Hash to: ${distinctValues[0]}`)
        commonHash = distinctValues[0]
      }
    }

    core.setOutput('youngest', commonHash)
  } catch (error) {
    core.setFailed(error.message)
  }
}

function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(find, 'g'), replace)
}

run()
