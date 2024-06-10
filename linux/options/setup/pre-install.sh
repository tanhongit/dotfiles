#!/bin/bash

if [ ! -d ~/.themes/macOS-master ]; then
    mkdir ~/.themes
    sudo git clone https://github.com/B00merang-Project/macOS ~/.themes/macOS-master
fi

if [ ! -d ~/.icons/la-capitaine-icon-theme ]; then
    mkdir ~/.icons
    sudo git clone https://github.com/keeferrourke/la-capitaine-icon-theme ~/.icons/la-capitaine-icon-theme
fi
