#!/bin/bash

OS=$(uname -s)

case "$OS" in
  "Darwin")
    echo "Running on MacOS"
    cd macos || exit
    bash install.sh "$1"
    ;;
  "Linux")
    # shellcheck disable=SC1091
    if [ -f "/etc/os-release" ]; then
      . /etc/os-release
      echo "Running on $NAME"
      cd linux || exit
      bash install.sh "$1"
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
