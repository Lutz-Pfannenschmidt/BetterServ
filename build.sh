#!/usr/bin/env bash

# Check if nvm is installed
if [ ! -d ~/.nvm ]; then
  echo "nvm is not installed. Please install nvm first."
  exit 1
fi

source ~/.nvm/nvm.sh
nvm use v21.7.1
npm install
npm run build

zip -r web-ext-artifacts/source.zip . -x ".vscode/*" -x "node_modules/*" -x ".git/*" -x "dist/*"
