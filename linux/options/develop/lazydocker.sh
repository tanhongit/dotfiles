#!/bin/bash

echo "=========================== lazydocker ==========================="
COMMAND_NAME="lazydocker"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    
    echo 'Check new version at https://github.com/jesseduffield/lazydocker/releases'
    echo 'Auto checking for latest version...'
    
    LAZYDOCKER_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazydocker/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
    
    echo "Installing lazydocker version $LAZYDOCKER_VERSION..."
    
    curl -Lo lazydocker.tar.gz "https://github.com/jesseduffield/lazydocker/releases/latest/download/lazydocker_${LAZYDOCKER_VERSION}_Linux_x86_64.tar.gz"
    tar xf lazydocker.tar.gz lazydocker
    sudo install lazydocker /usr/local/bin
    rm lazydocker.tar.gz lazydocker
    
    echo "$COMMAND_NAME installed successfully!"
else
    echo "$COMMAND_NAME is already installed"
fi

echo ""
