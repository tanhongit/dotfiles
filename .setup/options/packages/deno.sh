#!/bin/bash

COMMAND_NAME="deno"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."

    while true; do
        if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
            yn="y"
        else
            read -r -p "Do you want to install $COMMAND_NAME? (Y/N)  " yn
        fi

        case $yn in
        [Yy]*)
            sudo snap install $COMMAND_NAME
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    done
else
    echo "$COMMAND_NAME install ok installed"
fi
