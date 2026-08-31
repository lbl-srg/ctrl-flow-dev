# Linkage

This project uses [Vite](https://vitejs.dev/) for front-end tooling (dev server and production builds).

## Quickstart

1. Copy the `.env.example` file and name it `.env`.
1. Run `npm i` to install NPM dependencies.
1. Run `npm start` to start the development server.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in development mode using the Vite dev server.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will hot-reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the Jest test runner.

### `npm run build`

Builds the app for production to the `build` folder using `vite build`.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include content hashes.\
Your app is ready to be deployed!

### `npm run buildForS3`

Builds the app for production the same way as `npm run build`, intended for deployment to the
project's S3-hosted environments (see the root `cdk/README.md` and the GitHub Actions deploy
workflows for how this is used).
