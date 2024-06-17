#!/bin/bash

UTILS_PACKAGE_LIST=("wine-stable" "vlc" "timeshift" "python3-pip")

for packageName in "${UTILS_PACKAGE_LIST[@]}"; do
    echo "=========================== $packageName ==========================="

    PKG_OK=$(dpkg-query -W --showformat='${Status}\n' "$packageName" | grep "install ok installed")
    echo "Checking for $packageName: $PKG_OK"
    if [ "" = "$PKG_OK" ]; then
        echo "No $packageName. Setting up $packageName."
        sudo apt-get install -y "$packageName"

        echo "=========================== pip3 - algoliasearch for ulauncher extension ==========================="
        if [ "python3-pip" = "$packageName" ]; then
            pip3 install algoliasearch --user
        fi
    fi
    echo ""
done

UTILS_PACKAGE_LIST=("rambox" "skype" "telegram-desktop" "slack" "zoom-client" "termius-app" "obs-studio")
for packageName in "${UTILS_PACKAGE_LIST[@]}"; do
    echo "=========================== $packageName ==========================="
    if ! command -v "$packageName" &>/dev/null; then
        echo "$packageName could not be found. Setting up $packageName."
        while true; do
            if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
                yn="y"
            else
                read -r -p "Do you want to install $packageName? (Y/N)  " yn
            fi
            case $yn in
            [Yy]*)
                sudo snap install "$packageName"
                break
                ;;
            [Nn]*) break ;;
            *) echo "Please answer yes or no." ;;
            esac
        done
    else
        echo "$packageName install ok installed"
    fi
    echo ""
done

echo "=========================== anydesk ==========================="
bash anydesk.sh
echo ""
