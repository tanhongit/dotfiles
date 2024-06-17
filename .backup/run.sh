#!/bin/bash

OS=$(uname -s)

case "$OS" in
  "Darwin")
    echo "Running on MacOS"
    ;;
  "Linux")
    if [ -f /etc/os-release ]; then
      . /etc/os-release
      echo "Running on $NAME"

      cp -TRv "${HOME}"/.p10k.zsh ../.p10k.zsh
      cp -TRv "${HOME}"/.zshrc ../.zshrc

      cp -TRv "${HOME}"/.psensor ../linux/.psensor
      cp -TRv "${HOME}"/.config/bleachbit ../linux/.config/bleachbit
      cp -TRv "${HOME}"/.config/autostart ../linux/.config/autostart
      cp -TRv "${HOME}"/.config/compton ../linux/.config/compton
      cp -TRv "${HOME}"/.config/nautilus ../linux/.config/nautilus
      cp -TRv "${HOME}"/.config/terminator ../linux/.config/terminator
      cp -TRv "${HOME}"/.config/ulauncher ../linux/.config/ulauncher
      cp -TRv "${HOME}"/.config/Dharkael ../linux/.config/Dharkael

      if [ "$NAME" == "Ubuntu" ]; then
          cp -TRv "${HOME}"/.config/dconf ../ubuntu/.config/dconf
          cp -TRv "${HOME}"/.config/mimeapps.list ../ubuntu/.config/mimeapps.list
          cp -TRv "${HOME}"/.config/gnome-shell ../ubuntu/.config/gnome-shell

          cp -TRv "${HOME}"/.local/share/sounds ../ubuntu/.local/share/sounds
          cp -TRv "${HOME}"/.local/share/grilo-plugins ../ubuntu/.local/share/grilo-plugins
          cp -TRv "${HOME}"/.local/share/gnome-shell ../ubuntu/.local/share/gnome-shell

      elif [ "$NAME" == "Zorin OS" ]; then
          cp -TRv "${HOME}"/.config/dconf ../zorin/.config/dconf
          cp -TRv "${HOME}"/.config/mimeapps.list ../zorin/.config/mimeapps.list

          cp -TRv "${HOME}"/.local/share/sounds ../zorin/.local/share/sounds
          cp -TRv "${HOME}"/.local/share/gnome-shell ../zorin/.local/share/gnome-shell
      fi
    elif command -v lsb_release &> /dev/null; then
      echo "Running on $(lsb_release -s -d)"
    else
      echo "Linux distribution detection requires /etc/os-release or lsb_release"
    fi
    ;;
  *)
    echo "Running on $OS"
    ;;
esac
