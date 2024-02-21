#!/bin/bash

echo '####################################################################'

echo "=================== Create virtual host tool ====================="
if [ ! -d "${ZSH_CUSTOM:-$HOME}"/tools/avhc_tool ]; then
    sudo git clone https://github.com/tanhongit/Apache-Virtual-Hosts-Creator.git "${ZSH_CUSTOM:-$HOME}"/tools/avhc_tool # clone tool create virtual host
else
    echo "Apache-Virtual-Hosts-Creator already installed"
fi
echo ''

echo "=========================== Web Server ==========================="
bash web-server.sh

installAptDevPackages() {
    PACKAGE_LIST=("filezilla" "software-properties-common" "apt-transport-https" "gpg")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        REQUIRED_PKG=$packageName
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' "$REQUIRED_PKG" | grep "install ok installed")
        echo "Checking for $REQUIRED_PKG: $PKG_OK"
        if [ "" = "$PKG_OK" ]; then
            echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
            sudo apt install -y "$REQUIRED_PKG"
        fi
        echo ''
    done
}
installAptDevPackages

if command -v "mysql-workbench-community" &>/dev/null; then
    echo "===================== config for workbrench ==================="
    sudo snap connect mysql-workbench-community:password-manager-service :password-manager-service
fi
echo ''

echo "=========================== phpstorm ==========================="
COMMAND_NAME="phpstorm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    while true; do
        if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
            yn="y"
        else
            read -r -p "Do you want to install $COMMAND_NAME? (Y/N)  " yn
        fi

        case $yn in
        [Yy]*)
            sudo snap install $COMMAND_NAME --classic
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    done
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ''

echo "=========================== composer ==========================="
COMMAND_NAME="composer"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt install curl unzip -y
    curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
    HASH=$(curl -sS https://composer.github.io/installer.sig)
    php -r "if (hash_file('SHA384', '/tmp/composer-setup.php') === '$HASH') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
    sudo php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ''

echo "=========================== localtunnel ==========================="
PACKAGE_NAME="localtunnel"
if [[ "$(npm list -g $PACKAGE_NAME)" =~ "empty" ]]; then
    echo "$PACKAGE_NAME could not be found. Setting up $PACKAGE_NAME."
    sudo npm install -g $PACKAGE_NAME
else
    echo "$PACKAGE_NAME is already installed"
fi
echo "how it works : lt --port 8000"
echo ''

echo "=========================== vite ==========================="
COMMAND_NAME="vite"
if ! command -v $COMMAND_NAME &>/dev/null; then
    while true; do
        if [[ $ACCEPT_INSTALL =~ ^[Yy]$ ]]; then
            yn="y"
        else
            read -r -p "Do you want to install $COMMAND_NAME? (Y/N)  " yn
        fi

        case $yn in
        [Yy]*)
            sudo apt-get install -y $COMMAND_NAME
            break
            ;;
        [Nn]*) break ;;
        *) echo "Please answer yes or no." ;;
        esac
    done
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ''
