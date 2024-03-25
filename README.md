# setup-lilypond

This action sets up an environment to compile musical scores with
[LilyPond](https://lilypond.org). This action:

## Features

- Runs on all types of runners (Ubuntu, macOS, Windows)
- Allows you to use the LilyPond version of your preference (only version 2.23.7
  and above)
- Includes a problem matcher to create code annotations for LilyPond warnings
  and errors.
- Supports the installation of
  [OpenLilyPondFonts](https://github.com/OpenLilyPondFonts).

## Usage

Use this action like as any other setup action:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: codello/setup-lilypond@main
    with:
      lilypond-version: 2.24
  # You can now run LilyPond commands
  - run: lilypond score.ly
```

### Select LilyPond Version

The action lets you choose the LilyPond version. Because LilyPond versions are
selected from [GitLab releases](https://gitlab.com/lilypond/lilypond/-/releases)
only versions 2.23.7 and newer are supported. New versions are immediately
available.

You can select the version using the (required) `lilypond-version` argument. The
value can take several forms:

- A major-minor version pair. The highest patch version available will be
  selected (e.g. `2.24`). This is the recommended usage.
- A SemVer range of supported versions. The highest available version matching
  the range will be selected (e.g. `^2.24.0`)
- A specific version (e.g. `2.24.4`)
- The special values `stable` or `development`. The highest available
  stable/development version will be selected.

> [!WARNING]
>
> It is not recommended to use `stable` or `development`. Newer versions of
> LilyPond may contain breaking changes. The special tags always select the
> newest version available at execution time which may suddenly break your code.

### Install Notation Fonts

The action includes limited support for additional notation fonts. You can use
the `ol-fonts` argument to install additional fonts from
[OpenLilyPondFonts](https://github.com/OpenLilyPondFonts) like so:

```yaml
steps:
  - uses: codello/setup-lilypond@main
    with:
      lilypond-version: 2.24
      ol-fonts: beethoven,haydn
```

Currently the support is pretty rudimentary. Fonts outside of OpenLilyPondFonts
are currently not supported by this action and must be installed manually.

> [!IMPORTANT]
>
> The action will only install the required notation font files from the `otf`
> and `svg` folders. Additional text fonts and stylesheets are not installed
> automatically.
