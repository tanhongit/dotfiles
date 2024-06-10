#!/bin/bash

APP_LIST=("phpstorm")

for appName in "${APP_LIST[@]}"; do
    echo "=========================== $appName ==========================="

    PKG_OK=$(brew list --cask | grep "^$appName$")
    echo "Checking for $appName: $PKG_OK"
    if [ "" = "$PKG_OK" ]; then
        echo "No $appName. Setting up $appName."

        while true; do
            if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
                yn="y"
            else
                read -r -p "Do you want to install $appName? (Y/N)  " yn
            fi
            case $yn in
            [Yy]*)
                brew install --cask "$appName"
                break
                ;;
            [Nn]*) break ;;
            *) echo "Please answer yes or no." ;;
            esac
        done
    else
        echo "$appName install ok installed"
    fi
    echo ""
done
