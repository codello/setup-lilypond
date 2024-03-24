import * as tc from '@actions/tool-cache'
import * as io from '@actions/io'
import semver from 'semver'
import * as path from 'path'
import { glob } from 'glob'

/**
 * Installs a notation font from OpenLilyPondFonts: https://github.com/OpenLilyPondFonts
 * @param name {string} The name of the font repo.
 * @param installDir {string} The directory where LilyPond is installed.
 * @param version {semver.SemVer} The version of LilyPond.
 */
export async function addNotationFont(
  name: string,
  installDir: string,
  version: semver.SemVer
): Promise<void> {
  const downloadPath = await tc.downloadTool(
    `https://github.com/OpenLilyPondFonts/${name}/archive/refs/heads/master.zip`
  )
  const extPath = await tc.extractZip(downloadPath)
  for (const file of await glob(path.join(extPath, '*/otf/*.otf'))) {
    await io.cp(
      file,
      path.join(installDir, 'share/lilypond', version.version, 'fonts/otf')
    )
  }
  for (const file of await glob(path.join(extPath, '*/svg/*.{svg,woff}'))) {
    await io.cp(
      file,
      path.join(installDir, 'share/lilypond', version.version, 'fonts/svg')
    )
  }
}
