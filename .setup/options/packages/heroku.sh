#!/bin/bash

REQUIRED_PKG="heroku"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    if [ -n "$GITHUB_ACTION_INSTALL" ] && [ "$GITHUB_ACTION_INSTALL" = true ]; then
        yn="y"
    fi
    while true; do
        read -p "Do you wish to install $REQUIRED_PKG? (y/n) " yn
        case $yn in
        [Yy]*)
            curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
            sodo $REQUIRED_PKG plugins:install heroku-accounts
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    done
fi