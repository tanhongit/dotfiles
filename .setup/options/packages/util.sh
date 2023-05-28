#!/bin/bash

echo "========== ulauncher ==========="
REQUIRED_PKG="ulauncher"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo "Checking for $REQUIRED_PKG: $PKG_OK"
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo add-apt-repository ppa:agornostal/$REQUIRED_PKG
    sudo apt -y update
    sudo apt -y install $REQUIRED_PKG
fi

echo "========== flameshot =========="
COMMAND_NAME="flameshot"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt install -y $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi
