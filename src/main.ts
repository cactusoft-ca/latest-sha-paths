import * as core from '@actions/core';
import * as exec from '@actions/exec';

const cache = new Map<string, number>();

async function isDescendant(maybeDescendantHash: string, ancestorHash: string) {
  if (cache.has(maybeDescendantHash + ancestorHash)) {
    return cache.get(maybeDescendantHash + ancestorHash) as number;
  }
  if (maybeDescendantHash === ancestorHash) return 0;
  const result = await exec.getExecOutput('git merge-base --is-ancestor ' + ancestorHash + ' ' + maybeDescendantHash,  undefined, { ignoreReturnCode: true });
  const isDescendant = result.exitCode === 0 ? -1 : 1;
  cache.set(maybeDescendantHash + ancestorHash, isDescendant);
  return isDescendant;
}

/**
 * return the mid value among x, y, and z
 * @param x
 * @param y
 * @param z
 * @param compare
 * @returns {Promise.<*>}
 */
 async function getPivot<T>(x: T, y: T, z: T, compare: (x: T, y: T) => Promise<number>) {
  if (await compare(x, y) < 0) {
    if (await compare(y, z) < 0) {
      return y;
    } else if (await compare(z, x) < 0) {
      return x;
    } else {
      return z;
    }
  } else if (await compare(y, z) > 0) {
    return y;
  } else if (await compare(z, x) > 0) {
    return x;
  } else {
    return z;
  }
}

/**
 * asynchronous quick sort
 * @param arr array to sort
 * @param compare asynchronous comparing function
 * @param left index where the range of elements to be sorted starts
 * @param right index where the range of elements to be sorted ends
 * @returns {Promise.<*>}
 */
async function quickSort<T>(arr: T[], compare: (x: T, y: T) => Promise<number>, left = 0, right = arr.length - 1) {
  if (left < right) {
    let i = left, j = right, tmp;
    const pivot = await getPivot(arr[i], arr[i + Math.floor((j - i) / 2)], arr[j], compare);
    while (true) {
      while (await compare(arr[i],  pivot) < 0) {
        i++;
      }
      while (await compare(pivot, arr[j]) < 0) {
        j--;
      }
      if (i >= j) {
        break;
      }
      tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;

      i++;
      j--;
    }
    await quickSort(arr, compare, left, i - 1);
    await quickSort(arr, compare, j + 1, right);
  }
  return arr;
}


async function run(): Promise<void> {
  try {

    const paths = core.getMultilineInput('paths', { required: true });


    // printing the list of paths provided
    core.debug('List of provided paths:')
    for (let path of paths) {
      core.debug(path)
    }



    let hashset: Set<string> = new Set<string>()
    let listGetShaError: Array<string> = new Array<string>()

    // Get git hashes for each folder/file from the input parameters
    for (const path of paths) {
      const result = await exec.getExecOutput('git', ['log', '--pretty=format:"%H"', '-n1', path]);
      if (!hashset.has(result.stdout)) {
        hashset.add(result.stdout);
      }
    }


    // printing the list of paths provided
    core.debug('List of sha paths:')
    for (let sha of hashset) {
      core.debug(sha)
    }

    const sorted = await quickSort(Array.from(hashset), (x, y) => {
      return isDescendant(x, y);
    });

    // Get oldest and youngest
    const youngest = sorted[0];
    const oldest = sorted[sorted.length -1];

    core.setOutput('youngest', youngest);
    core.setOutput('oldest', oldest);

  } catch (error) {
    core.setFailed(error.message)
  }
}
// async function isAncestor(): Promise<boolean> {

//   git merge-base --is-ancestor <maybe-ancestor-commit> <descendant-commit>
//   return true;
// }
run()
