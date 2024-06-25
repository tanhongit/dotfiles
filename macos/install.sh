#!/bin/bash

bash packages/homebrew.sh

# Brew bundle
if [[ $1 =~ ^bundle$ ]] || [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
  bash packages/bundle.sh
fi

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
brewInstallation() {
    APP_LIST=("openkey" "rectangle" "maccy" "keepingyouawake" "iterm2" "karabiner-elements" "skype" "spotify" "anydesk" "teamviewer" "obs" "chatgpt" "slack" "gpg-suite" "notion" "zoom" "figma" "vlc")

    for appName in "${APP_LIST[@]}"; do
        echo "=========================== $appName ==========================="

        PKG_OK=$(brew list --cask | grep "^$appName$")
        AppNameCapitalized=$(echo "$appName" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
        APP_PATH="/Applications/$AppNameCapitalized.app"

        echo "Checking for $appName: $PKG_OK"
        if [[ -z "$PKG_OK" && ! -d "$APP_PATH" ]]; then
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
}

brewFormulaInstallation() {
    APP_LIST=("flameshot")

    for appName in "${APP_LIST[@]}"; do
        echo "=========================== $appName ==========================="

        PKG_OK=$(brew list --formula | grep "^$appName$")
        AppNameCapitalized=$(echo "$appName" | awk '{print toupper(substr($0,1,1)) tolower(substr($0,2))}')
        APP_PATH="/Applications/$AppNameCapitalized.app"

        echo "Checking for $appName: $PKG_OK"
        if [[ -z "$PKG_OK" && ! -d "$APP_PATH" ]]; then
            echo "No $appName. Setting up $appName."

            while true; do
                if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
                    yn="y"
                else
                    read -r -p "Do you want to install $appName? (Y/N)  " yn
                fi
                case $yn in
                [Yy]*)
                    brew install "$appName"
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
}

while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install packages, app with brew? (Y/N)  " yn
    fi
    case $yn in
    [Yy]*)
        brewInstallation
        brewFormulaInstallation
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
    sudo spctl --master-enable
fi

while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install zsh (Need if it not installed)? (Y/N)  " yn
    fi
    case $yn in
    [Yy]*)
        bash config.sh
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to import config for apps? (Y/N)  " yn
    fi
    case $yn in
    [Yy]*)
        cd Preferences || exit
        bash config.sh
        cd ../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
