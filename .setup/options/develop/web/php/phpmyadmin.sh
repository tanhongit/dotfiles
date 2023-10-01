#!/bin/bash

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
