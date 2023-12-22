# Speedforce

### Start

```
npm install
npm start
```

### Build distributables

```
npm run make # builds for current OS
```

```
npm run make -- --arch=arm64,x64
```

```
npm run make -- --arch=universal --platform=darwin # single build that works on intel and apple silicon, but doubles size
```

```
electron-forge package --arch=x64 --platform=darwin # untested but is supposed to build for intel only
```

```
electron-forge publish --arch=arm64,x64 --debug
```

#### Check if app is notarized

```
spctl -a -vvv -t install /Applications/Speedforce.app/
```

### Environment variables

Create a `.env.main` file in the root directory with the following variables:

```
GH_TOKEN= # won't need GH_TOKEN when we have public releases which will be stored on a public repo
GH_OWNER=
GH_REPO=
```

Create a `.env.renderer` file in the root directory with the following variables:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

These env variables need to be set in your terminal so that they are not available in the built app. You may also need to set the above GitHub env variables in the terminal as well.

```
APPLE_ID=
APPLE_ID_PASSWORD=
TEAM_ID=
```

Built with [Electron-Forge](https://www.electronforge.io/)
