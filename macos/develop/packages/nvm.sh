#!/bin/bash

# Install nvm
if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
    nvm install --lts
fi
