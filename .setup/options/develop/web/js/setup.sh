#!/bin/bash

echo '####################################################################'
echo '################################ Js ################################'

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
