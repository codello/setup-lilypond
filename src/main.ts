import * as path from 'path'
import cp from 'child_process'

import * as semver from 'semver'
import { Gitlab } from '@gitbeaker/rest'
import * as core from '@actions/core'
import * as io from '@actions/io'

import * as installer from './installer'
import * as fonts from './fonts'

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
    core.exportVariable('LILYPOND_DATADIR', path.join(installDir, 'share', 'lilypond', version.version))
    core.addPath(path.join(installDir, 'bin'))

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

    const fontList = core
      .getInput('ol-fonts')
      .split(',')
      .map(f => f.trim())
      .filter(Boolean)
    if (fontList.length > 0) {
      for (const font of fontList) {
        await core.group(`Installing OpenLilyPondFont ${font}`, async () => {
          await fonts.addNotationFont(font, installDir, version)
        })
      }
    }

    // add problem matchers
    const matchersPath = path.join(__dirname, '..', 'problem-matcher.json')
    core.info(`##[add-matcher]${matchersPath}`)

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
