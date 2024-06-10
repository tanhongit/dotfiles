#!/bin/bash

COMMAND_NAME="nvm"
if [ ! -s "$HOME/.nvm/nvm.sh" ]; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    curl https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash

    # shellcheck disable=SC1090
    source ~/.profile

    # get and convert the number of the latest version of node
    NODE_VERSION=$(nvm ls-remote | grep LTS | tail -n 1 | awk '{print $1}')
    NODE_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
    echo "Installing node version $NODE_VERSION..."

    nvm install "$NODE_VERSION"
    nvm use "$NODE_VERSION"
    nvm alias default "$NODE_VERSION"
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

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
