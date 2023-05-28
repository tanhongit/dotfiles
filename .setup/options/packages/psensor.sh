#!/bin/bash

REQUIRED_PKG="psensor"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo "Checking for $REQUIRED_PKG: $PKG_OK"
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt-get install -y lm-sensors hddtemp
    sudo dpkg-reconfigure hddtemp
    sudo sensors-detect
    sudo apt-get install -y $REQUIRED_PKG
fi
