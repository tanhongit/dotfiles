#!/bin/bash

echo "=========================== nvm ==========================="
COMMAND_NAME="nvm"
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    curl https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

    source "$HOME/.profile"

    nvm install node
    nvm use node
    nvm alias default node
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

# if nvm is not installed
if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    COMMAND_NAME="n"
    if ! command -v $COMMAND_NAME &>/dev/null; then
        echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
        sudo npm cache clean -f
        sudo npm install -g $COMMAND_NAME stable
    else
        echo "$COMMAND_NAME install ok installed"
    fi

    COMMAND_NAME="npm"
    if ! command -v $COMMAND_NAME &>/dev/null; then
        echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
        sudo npm install -g $COMMAND_NAME
    else
        echo "$COMMAND_NAME install ok installed"
    fi
fi
