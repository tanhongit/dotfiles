#!/bin/bash

cp -TRv "${ZSH_CUSTOM:-$HOME}"/.psensor ../.psensor
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.bashrc ../.bashrc
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.p10k.zsh ../.p10k.zsh
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.zshrc ../.zshrc

cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/bleachbit ../.config/bleachbit
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/autostart ../.config/autostart
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/compton ../.config/compton
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/nautilus ../.config/nautilus
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/terminator ../.config/terminator
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/ulauncher ../.config/ulauncher
cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/Dharkael ../.config/Dharkael

# shellcheck disable=SC1091
if [ -f "/etc/os-release" ]; then
    . /etc/os-release
    OS=$NAME

    if [ "$OS" == "Ubuntu" ]; then
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/dconf ../ubuntu/.config/dconf
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/mimeapps.list ../ubuntu/.config/mimeapps.list
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/gnome-shell ../ubuntu/.config/gnome-shell

        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.local/share/sounds ../ubuntu/.local/share/sounds
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.local/share/grilo-plugins ../ubuntu/.local/share/grilo-plugins
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.local/share/gnome-shell ../ubuntu/.local/share/gnome-shell

    elif [ "$OS" == "Zorin OS" ]; then
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/dconf ../zorin/.config/dconf
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.config/mimeapps.list ../zorin/.config/mimeapps.list

        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.local/share/sounds ../zorin/.local/share/sounds
        cp -TRv "${ZSH_CUSTOM:-$HOME}"/.local/share/gnome-shell ../zorin/.local/share/gnome-shell
    fi
fi
