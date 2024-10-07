#!/bin/bash

workingDir=$(pwd)
echo "Current working directory: $workingDir"
npm run build
cp -r ./src/misc-files/* ./dist/src/misc-files/
echo "Copy files completed"
echo "Building the engine"

sleep 10
echo "Starting the app"
npm run start-engine
