#!/bin/bash

while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to update apt? [Y/n] " yn
    fi

    case $yn in
    [Yy]*)
        sudo apt update -y
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
