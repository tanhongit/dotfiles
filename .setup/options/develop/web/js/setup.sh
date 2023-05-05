#!/bin/bash

echo '####################################################################'
echo '################################ Js ################################'
echo '####################################################################'
echo ""

echo "=========================== Yarn ==========================="
COMMAND_NAME="yarn"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
    echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
    sudo apt install $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

echo "=========================== Webstorm ==========================="
COMMAND_NAME="webstorm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    while true; do
        read -p "Do you want to install webstorm IDE? (y/n) " yn
        case $yn in
        [Yy]*)
            sudo snap install $COMMAND_NAME --classic
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    done
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""