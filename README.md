# artemis-core

## For Developers

### DEV Machine Prerequisites
Git - can be installed ([git site](https://git-scm.com/downloads)).

Node.js - can be installed from [Nodejs.org](https://nodejs.org).

Gulp - can be installed by running `npm i -g gulp`
    
### One time Installation
```sh
git clone https://github.com/LeerixLabs/artemis-core.git
```
Git clone. Clone the GitHub repository to your local machine.

    npm install

### On Work Start
Starts the dev server on `http://localhost:8080/webpack-dev-server/`
    
    npm start

### Build development
Сompiles in directory `dist` the file `artemis.core.js` with sourse-map
```sh
gulp  # runs webpack
```

### Build
Сompiles in directory `dist` the minified file `artemis.core.js` without sourse-map
    
    npm run build

### Publishing
```sh
# for publishing to npm registry:
npm run build
npm publish
```
