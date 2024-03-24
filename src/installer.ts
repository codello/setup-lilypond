import os from 'os'
import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import semver from 'semver'

export async function installLilyPond(version: semver.SemVer): Promise<string> {
  const toolPath = tc.find('lilypond', version.version)
  if (toolPath) {
    core.info(`Found LilyPond ${version} in cache @ ${toolPath}`)
    return toolPath
  }
  const url = downloadUrl(version)
  core.info(`Downloading LilyPond from ${url}`)
  const downloadPath = await tc.downloadTool(url)
  const opts = ['--extract', '--gzip', '--strip-components=1']
  core.info(`Extracting LilyPond with options ${opts}...`)
  const extPath = await tc.extractTar(downloadPath, undefined, opts)
  core.info('Adding LilyPond to tools cache...')
  const toolCacheDir = await tc.cacheDir(extPath, 'lilypond', version.version)
  core.info(`Successfully cached LilyPond to ${toolCacheDir}`)
  return toolCacheDir
}

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
