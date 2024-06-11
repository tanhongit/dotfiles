#!/bin/bash

REQUIRED_PKG="zsh"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo "Checking for $REQUIRED_PKG: $PKG_OK"
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt-get install -y $REQUIRED_PKG

    # start ====== oh-my-zsh
    sudo git clone https://github.com/robbyrussell/oh-my-zsh.git ~/.oh-my-zsh

    bash ../../../global/zsh-additional.sh
fi
