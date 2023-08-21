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

    const list: {hashes: string[], length: number, hashSet: Set<string>}[] = []

    for (const sha of hashset) {
      const result = await exec.getExecOutput(
        'git',
        ['log', '--ancestry-path', `${sha}...HEAD`, "--pretty='%H'"],
        {silent: true}
      )

      const hashes: string[] = result.stdout
        .split(/\r?\n/)
        .map((x: string) => replaceAll(replaceAll(x, '"', ''), "'", ''))
        .filter((x: any) => x)

      hashes.push(sha)
      list.push({hashes, length: hashes.length, hashSet: new Set(hashes)})
    }

    const smallestLength = Math.min(...list.map(x => x.length))
    const smallestList = list.find(x => x.length === smallestLength) ?? list[0]
    let commonHash

    for (let i = smallestLength - 1; i >= 0; i --) {
      // Get the last hash to check for common ancestry
      const hash = smallestList.hashes[i]

      // Check if all trees contains that hash
      if (list.filter(x => !x.hashSet.has(hash)).length === 0) {
        core.debug(`Found last common hash value: ${hash}`)
        commonHash = hash
        break
      }
    }

    core.setOutput('youngest', commonHash)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(find, 'g'), replace)
}

run()
