#!/bin/bash

installSnapDevPackages() {
    PACKAGE_LIST=("postman" "ngrok")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        COMMAND_NAME=$packageName
        if ! command -v $COMMAND_NAME &>/dev/null; then
            echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
            sudo snap install $COMMAND_NAME
        else
            echo "$COMMAND_NAME install ok installed"
        fi
        echo ""
    done
}
installSnapDevPackages

bash vscode.sh

echo "=========================== nvm ==========================="
COMMAND_NAME="nvm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    curl https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
    source ~/.profile
    # nvm install node
    # nvm install 18.7.0
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""