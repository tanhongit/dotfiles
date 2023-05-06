#!/bin/bash

COMMAND_NAME="anydesk"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    if [ -n "$GITHUB_ACTION_INSTALL" ] && [ "$GITHUB_ACTION_INSTALL" = true ]; then
        yn="y"
    fi
    while true; do
        read -p "Do you wish to install this program? (Y/N)  " yn
        case $yn in
        [Yy]*)
            wget -qO - https://keys.anydesk.com/repos/DEB-GPG-KEY | sudo apt-key add -
            echo "deb http://deb.anydesk.com/ all main" | sudo tee /etc/apt/sources.list.d/anydesk-stable.list
            sudo apt update -y
            sudo apt install $COMMAND_NAME -y
            systemctl disable $COMMAND_NAME.service
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    done
else
    echo "$COMMAND_NAME install ok installed"
fi