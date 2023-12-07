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

    # shellcheck disable=SC1091
    if [ -f "/etc/os-release" ]; then
        . /etc/os-release
        OS=$NAME

        if [ "$OS" == "Ubuntu" ]; then
            sudo apt install mkcert -y
        elif [ "$OS" == "Zorin OS" ]; then
            sudo wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.3/mkcert-v1.4.3-linux-amd64 -O mkcert
            sudo chmod +x mkcert
            sudo mv mkcert /usr/local/bin/
        fi
    fi

    mkcert -install
    if [ ! -d "/var/www/certs" ]; then
        sudo mkdir /var/www/certs
    fi
    if [ ! -d "/var/www/logs" ]; then
        sudo mkdir /var/www/logs
    fi
    mkcert -cert-file /var/www/certs/localhost.pem -key-file /var/www/certs/localhost-key.pem localhost
    sudo systemctl reload "$WEB_SERVER"
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ''
