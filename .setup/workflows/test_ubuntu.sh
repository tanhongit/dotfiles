#!/bin/bash

export GITHUB_ACTION_INSTALL=true

if [ -n "$GITHUB_ACTION_INSTALL" ] && [ "$GITHUB_ACTION_INSTALL" = true ]; then
    yn="y"
fi
while true; do
    read -p "Do you want to update apt? [Y/n] " yn
    case $yn in
    [Yy]*)
        sudo apt update -y
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done