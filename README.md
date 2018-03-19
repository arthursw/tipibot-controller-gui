# Tipibot controller

[Controller](https://arthursw.github.io/tipibot-controller/) for the Tipibot

# Set Arduino Create Agent

## OS X

Change settings in `ArduinoCreateAgent.app/Contents/MacOS` to add allowed origins :
 - https://arthursw.github.io/tipibot-controller/
 - http://localhost:8080/

 # Todo

  - refactor Plot (SVG plot is not relevant)
  - Polargraph sends penUp() every 30 secs of inactivity to keep the tipibot awake, add this in settings?

# Compile and use

 - `npm install`
 - then `npm start` will not start immediately since custom paper types must be installed
 - copy the custom paper types from `libs/paper-types.index.d.ts` to `node_modules/@types/paper/index.d.ts`:
   - `cp libs/paper-types.index.d.ts "node_modules/@types/paper/index.d.ts"`
