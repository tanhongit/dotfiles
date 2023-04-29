#!/bin/bash

installPackages() {
    PACKAGE_LIST=("curl" "ibus-unikey" "wget" "vim" "tmux" "nano" "net-tools" "terminator" "nodejs" "npm" "gnome-tweaks" "snapd" "lighttpd" "gparted" "playonlinux" "bleachbit" "dconf-editor" "chrome-gnome-shell" "gnome-shell-extensions" "libfuse2" "gedit")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        REQUIRED_PKG=$packageName
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
        echo Checking for $REQUIRED_PKG: $PKG_OK
        if [ "" = "$PKG_OK" ]; then
            echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
            sudo apt-get install -y $REQUIRED_PKG
        fi
        echo ""
    done
}
installPackages

COMMAND_NAME="n"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo npm cache clean -f
    sudo npm install -g $COMMAND_NAME stable
else
    echo "$COMMAND_NAME install ok installed"
fi

COMMAND_NAME="npm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo npm install -g $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi

echo "=========================== heroku and set multiple accounts ==========================="
REQUIRED_PKG="heroku"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    while true; do
        read -p "Do you want to install some packages, programs for web developer? (Y/N)  " yn
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

echo "=========================== ulauncher ==========================="
REQUIRED_PKG="ulauncher"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo add-apt-repository ppa:agornostal/$REQUIRED_PKG
    sudo apt -y update
    sudo apt -y install $REQUIRED_PKG
fi

echo "=========================== deno ==========================="
COMMAND_NAME="deno"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo snap install $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi

echo "=========================== flameshot ==========================="
COMMAND_NAME="flameshot"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt install -y $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi