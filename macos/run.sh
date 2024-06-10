#!/bin/bash

bash packages/homebrew.sh

brew bundle

if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
    brew tap homebrew/cask
fi

echo '####################################################################'
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install some packages, programs for Developer? (Y/N)  " yn
    fi
    case $yn in
    [Yy]*)
        cd develop || exit
        bash setup.sh
        cd ../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

echo '####################################################################'
APP_LIST=("skype" "anydesk" "obs" "chatgpt" "slack" "gpg-suite" "notion" "zoom" "figma")

for appName in "${APP_LIST[@]}"; do
    echo "=========================== $appName ==========================="
    REQUIRED_PKG=$appName
    PKG_OK=$(brew list --cask | grep "^$REQUIRED_PKG$")
    echo "Checking for $REQUIRED_PKG: $PKG_OK"
    if [ "" = "$PKG_OK" ]; then
        echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."

        if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
            yn="y"
        else
            read -r -p "Do you want to install $REQUIRED_PKG? (Y/N)  " yn
        fi

        case $yn in
        [Yy]*)
            brew install --cask "$REQUIRED_PKG"
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    fi
    echo ""
done

if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
    sudo spctl --master-enable
fi
