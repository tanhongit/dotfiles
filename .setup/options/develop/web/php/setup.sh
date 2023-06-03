#!/bin/bash

echo '####################################################################'
echo '############################### web service ###############################'
echo ''
sudo git clone https://github.com/tanhongit/Apache-Virtual-Hosts-Creator.git "${ZSH_CUSTOM:-$HOME}"/tools/avhc_tool # clone tool create virtual host
echo ''

bash web-server.sh
bash tools.sh

echo "=========================== phpmyadmin ==========================="
REQUIRED_PKG="phpmyadmin"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo "Checking for $REQUIRED_PKG: $PKG_OK"
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y $REQUIRED_PKG php-json
    sudo phpenmod mbstring
    sudo systemctl restart apache2
fi
echo ''

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
        echo ""
    done
}
installAptDevPackages

installSnapDevPackages() {
    PACKAGE_LIST=("mysql-workbench-community" "dbeaver-ce")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        COMMAND_NAME=$packageName
        if ! command -v "$COMMAND_NAME" &>/dev/null; then
            echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
            sudo snap install "$COMMAND_NAME"
        else
            echo "$COMMAND_NAME install ok installed"
        fi
        echo ""
    done
}
installSnapDevPackages

echo "===================== config for workbrench ==================="
sudo snap connect mysql-workbench-community:password-manager-service :password-manager-service

echo "=========================== phpstorm ==========================="
COMMAND_NAME="phpstorm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo snap install $COMMAND_NAME --classic
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

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
echo ""

echo "=========================== localtunnel ==========================="
PACKAGE_NAME="localtunnel"
if [[ "$(npm list -g $PACKAGE_NAME)" =~ "empty" ]]; then
    echo "$PACKAGE_NAME could not be found. Setting up $PACKAGE_NAME."
    sudo npm install -g $PACKAGE_NAME
else
    echo "$PACKAGE_NAME is already installed"
fi
echo "how it works : lt --port 8000"
echo ""

echo "=========================== vite ==========================="
COMMAND_NAME="vite"
if ! command -v $COMMAND_NAME &>/dev/null; then
    sudo apt-get install -y $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""
