#!/bin/bash

WEB_SERVER=$1

echo "=========================== libnss3-tools ==========================="
REQUIRED_PKG="libnss3-tools"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo "Checking for $REQUIRED_PKG: $PKG_OK"
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y $REQUIRED_PKG
fi
echo ''

echo "=========================== mkcert ==========================="
COMMAND_NAME="mkcert"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."

    cd ~ || exit
    sudo apt install mkcert -y

    mkcert -install
    mkdir /var/www/certs
    mkdir /var/www/logs
    mkcert -cert-file /var/www/certs/localhost.pem -key-file /var/www/certs/localhost-key.pem localhost
    sudo chmod 777 /etc/"$WEB_SERVER"/sites-available/*
    sudo systemctl reload "$WEB_SERVER"
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ''
