#!/bin/bash

echo '####################################################################'
echo '################################ Js ################################'
echo '####################################################################'
echo ""

echo "=========================== Yarn ==========================="
COMMAND_NAME="yarn"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."

    # remove .yarn already exists
    if test -d "$HOME/.yarn"; then
        rm -rf $HOME/.yarn
    fi

    sudo apt install -y npm
    sudo npm install --global yarn
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

echo "=========================== Webstorm ==========================="
COMMAND_NAME="webstorm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    while true; do
        if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
            yn="y"
        else
            read -p "Do you want to install webstorm IDE? (y/n) " yn
        fi

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