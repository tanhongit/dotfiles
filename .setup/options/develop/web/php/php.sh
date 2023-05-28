#!/bin/bash

echo "=========================== PHP ==========================="
COMMAND_NAME="php"
if ! command -v $COMMAND_NAME &>/dev/null; then
    sudo apt install lsb-release ca-certificates apt-transport-https software-properties-common -y
    echo "*****************"
    echo "***Press Enter***"
    echo "*****************"
    sudo add-apt-repository ppa:ondrej/php

    echo "*****************"
    echo 'Auto checking for latest version...'
    PHP_VERSION=$(curl -s https://www.php.net/downloads | grep -oP 'PHP [0-9]+\.[0-9]+' | head -1 | awk '{print $2}')

    setPHPVersion() {
        PHP_VERSION=$1
        echo "You choose php$PHP_VERSION"
    }
    PS3="Select setup the php version (press * to setup default version - php$PHP_VERSION) - (latest version is php$PHP_VERSION): "
    select opt in "8.2" "8.1" "8.0" "7.4" "7.2" "7.0" "5.6"; do
        case $opt in
        "8.2")
            setPHPVersion "8.2"
            break
            ;;
        "8.1")
            setPHPVersion "8.1"
            break
            ;;
        "8.0")
            setPHPVersion "8.0"
            break
            ;;
        "7.4")
            setPHPVersion "7.4"
            break
            ;;
        "7.2")
            setPHPVersion "7.2"
            break
            ;;
        "7.0")
            setPHPVersion "7.0"
            break
            ;;
        "5.6")
            setPHPVersion "5.6"
            break
            ;;
        *)
            echo "Invalid option $REPLY"
            echo "Auto set default: php$PHP_VERSION"
            break
            ;;
        esac
    done

    sudo apt install php$PHP_VERSION php$PHP_VERSION-common php$PHP_VERSION-mysql php$PHP_VERSION-curl php$PHP_VERSION-gd php$PHP_VERSION-redis php$PHP_VERSION-mbstring php$PHP_VERSION-xml php$PHP_VERSION-zip -y
    sudo a2enmod php$PHP_VERSION
    sudo a2enmod ssl
    sudo a2enmod rewrite
    sudo systemctl reload apache2
    sudo chmod 777 /var/www/
    sudo chmod 777 /var/www/html
    echo "<?php phpinfo();?>" >/var/www/html/info.php
    echo "go to http://localhost/info.php "
    echo ''
else
    echo "$COMMAND_NAME install ok installed"
fi
