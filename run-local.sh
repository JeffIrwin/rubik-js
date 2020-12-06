#!/bin/bash

# Run the HTML webpage (including JavaScript)
"/c/Program Files/Mozilla Firefox/firefox" _index-local.html

## To run jest unit testing on JavaScript (automatically done on push by
## .github/workflows/main.yml):
#
## First-time setup:
#npm install --save-dev jest
#
## Run tests:
#npm run test

