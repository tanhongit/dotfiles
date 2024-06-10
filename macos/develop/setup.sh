#!/bin/bash

brewInstallation() {
    APP_LIST=("visual-studio-code" "dbngin" "tableplus" "postman")

    for appName in "${APP_LIST[@]}"; do
        echo "=========================== $appName ==========================="

        PKG_OK=$(brew list --cask | grep "^$appName$")
        echo "Checking for $appName: $PKG_OK"
        if [ "" = "$PKG_OK" ]; then
            echo "No $appName. Setting up $appName."

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
        fi
        echo ""
    done
}
brewInstallation

echo '####################################################################'
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install some packages, programs for PHP web developer? (Y/N)  " yn
    fi

    case $yn in
    [Yy]*)
        cd php || exit
        bash setup.sh
        cd ../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done

echo '####################################################################'
while true; do
    if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
        yn="y"
    else
        read -r -p "Do you want to install some packages, programs for JS web developer? (Y/N)  " yn
    fi

    case $yn in
    [Yy]*)
        cd js || exit
        bash setup.sh
        cd ../
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
