#!/bin/bash

UTILS_PACKAGE_LIST=("wine-stable" "vlc" "timeshift" "python3-pip")

for packageName in "${UTILS_PACKAGE_LIST[@]}"; do
    echo "=========================== $packageName ==========================="
    REQUIRED_PKG=$packageName
    PKG_OK=$(dpkg-query -W --showformat='${Status}\n' "$REQUIRED_PKG" | grep "install ok installed")
    echo "Checking for $REQUIRED_PKG: $PKG_OK"
    if [ "" = "$PKG_OK" ]; then
        echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
        sudo apt-get install -y "$REQUIRED_PKG"

        echo "=========================== pip3 - algoliasearch for ulauncher extension ==========================="
        if [ "python3-pip" = "$REQUIRED_PKG" ]; then
            pip3 install algoliasearch --user
        fi
    fi
    echo ""
done

UTILS_PACKAGE_LIST=("obs-studio" "rambox" "skype" "telegram-desktop" "slack")
for packageName in "${UTILS_PACKAGE_LIST[@]}"; do
    echo "=========================== $packageName ==========================="
    if ! command -v "$packageName" &>/dev/null; then
        echo "$packageName could not be found. Setting up $packageName."
        while true; do
            if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
                yn="y"
            else
                # shellcheck disable=SC2162
                read -p "Do you want to install $packageName? (Y/N)  " yn
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
