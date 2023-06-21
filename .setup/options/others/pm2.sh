#!/bin/bash

# check if nvm, node installed and install pm2
if ! command -v "nvm" &>/dev/null; then
    echo "nvm could not be found. Setting up nvm."
    curl https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
    source "${ZSH_CUSTOM:-$HOME}"/.profile || source "${ZSH_CUSTOM:-$HOME}"/.bashrc

    nvm install node
    nvm use node
    nvm alias default node
fi

if ! command -v "pm2" &>/dev/null; then
    echo "pm2 could not be found. Setting up pm2."
    sudo npm install -g pm2
fi
