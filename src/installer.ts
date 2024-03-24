import fs from 'fs'
import os from 'os'
import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import { glob } from 'glob'
import semver from 'semver'
import * as path from 'path'

/**
 * Installs the specified version of LilyPond and returns the path of the installation.
 * @param version The version of LilyPond to be installed.
 */
export async function installLilyPond(version: semver.SemVer): Promise<string> {
  const toolPath = tc.find('lilypond', version.version)
  if (toolPath) {
    core.info(`Found LilyPond ${version} in cache @ ${toolPath}`)
    return toolPath
  }
  const url = downloadUrl(version)
  core.info(`Downloading LilyPond from ${url}`)
  const downloadPath = await tc.downloadTool(url)
  core.info(`Extracting LilyPond...`)
  const extPath = await tc.extractTar(downloadPath, undefined, [
    '--extract',
    '--gzip',
    '--strip-components=1'
  ])
  core.info('Adding LilyPond to tools cache...')
  const toolCacheDir = await tc.cacheDir(extPath, 'lilypond', version.version)
  core.info('Fixing File Modification Dates')
  const now = new Date()
  for (const file of await glob(path.join(toolCacheDir, '**', '*.go'))) {
    fs.utimes(file, now, now, () => {})
  }
  core.info(`Successfully installed LilyPond to ${toolCacheDir}`)
  return toolCacheDir
}

/**
 * Generate a download URL for the specified version of LilyPond.
 * @param version The LilyPond version to be downloaded.
 */
function downloadUrl(version: semver.SemVer): string {
  let arch = os.arch()
  if (arch === 'x64') {
    arch = 'x86_64'
  }
  let platform = os.platform().toString()
  if (platform === 'win32') {
    platform = 'mingw'
  }
  return `https://gitlab.com/lilypond/lilypond/-/releases/v${version}/downloads/lilypond-${version}-${platform}-${arch}.tar.gz`
}
