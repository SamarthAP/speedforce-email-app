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
npm run make -- --arch=universal --platform=darwin # single build that works on intel and apple silicon, but doubles size
```

```
electron-forge package --arch=x64 --platform=darwin # untested but is supposed to build for intel only
```

### Environment variables

Create a `.env` file in the root directory with the following variables:

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
```

Built with [Electron-Forge](https://www.electronforge.io/)
