import * as path from 'path'
import cp from 'child_process'

import * as semver from 'semver'
import { Gitlab } from '@gitbeaker/rest'
import * as core from '@actions/core'
import * as io from '@actions/io'

import * as installer from './installer'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const version = await resolveLilyPondVersion()
    if (!version) {
      core.setFailed('Could not resolve LilyPond version.')
      return
    }

    core.startGroup(`Setup LilyPond version ${version}`)
    const installDir = await installer.installLilyPond(version)
    core.endGroup()
    core.addPath(path.join(installDir, 'bin'))
    core.info('Added LilyPond to the path')

    const lilyPondPath = await io.which('lilypond')
    if (!lilyPondPath.trim()) {
      core.setFailed('lilypond binary not found after installation')
      return
    }
    const lilyPondVersion = (
      cp.execSync(`${lilyPondPath} --version`) || ''
    ).toString()
    await core.group('lilypond --version', async () => {
      core.info(lilyPondVersion)
    })

    // TODO: Setup Problem Matcher

    // Set outputs for other workflow steps to use
    core.setOutput('lilypond-version', version.version)
  } catch (error: unknown) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('unknown error')
    }
  }
}

/**
 * Resolves the concrete LilyPond version to be used based on the constraints
 * given as input.
 *
 * @return {Promise<semver.SemVer | null>} The version or null if no version could be determined.
 */
async function resolveLilyPondVersion(): Promise<semver.SemVer | null> {
  const versionSpec =
    core.getInput('lilypond-version', { required: true }) || 'stable'
  const version = semver.parse(versionSpec)
  if (version) {
    return version
  }

  const gitlab = new Gitlab({ token: '' })
  const releases = await gitlab.ProjectReleases.all('lilypond/lilypond', {
    includeHtmlDescription: false,
    perPage: 100
  })
  const releaseVersions = releases
    .map(r => semver.parse(r.tag_name))
    .flatMap(r => (r ? [r] : []))
  if (versionSpec === 'stable' || versionSpec === 'latest') {
    return releaseVersions.find(r => r.minor % 2 === 0) || null
  }
  if (['unstable', 'dev', 'devel', 'development'].includes(versionSpec)) {
    return releaseVersions.find(r => r.minor % 2 === 1) || null
  }
  return semver.maxSatisfying(releaseVersions, versionSpec)
}
