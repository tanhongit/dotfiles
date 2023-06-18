#!/bin/bash

WEB_SERVER=$1

echo "=========================== PHP ==========================="
COMMAND_NAME="php"
if ! command -v $COMMAND_NAME &>/dev/null; then
    sudo apt install lsb-release gnupg2 ca-certificates apt-transport-https software-properties-common -y
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

    phpExtensions() {
        sudo apt install php"$PHP_VERSION" php"$PHP_VERSION"-common php"$PHP_VERSION"-mysql php"$PHP_VERSION"-curl php"$PHP_VERSION"-gd php"$PHP_VERSION"-redis php"$PHP_VERSION"-mbstring php"$PHP_VERSION"-xml php"$PHP_VERSION"-zip php"$PHP_VERSION"-readline -y
    }

    if [[ $WEB_SERVER == "apache2" ]]; then
        phpExtensions
        sudo a2enmod php"$PHP_VERSION"
        sudo a2enmod ssl
        sudo a2enmod rewrite
    elif [[ $WEB_SERVER == "nginx" ]]; then
        ip addr show eth0 | grep inet | awk '{ print $2; }' | sed 's/\/.*$//'
        phpExtensions
        sudo apt install php"$PHP_VERSION"-fpm -y
        sudo systemctl enable php"$PHP_VERSION"-fpm
        sudo systemctl start php"$PHP_VERSION"-fpm

        sudo touch /etc/nginx/sites-available/localhost

        # shellcheck disable=SC2154
        sudo tee -a /etc/nginx/sites-available/localhost >/dev/null <<EOF
server {
        listen 80;
        root /var/www/html;
        index index.php index.html index.htm index.nginx-debian.html;
        server_name localhost;

        location / {
                try_files $uri $uri/ =404;
        }

        location ~ \.php$ {
                include snippets/fastcgi-php.conf;
                fastcgi_pass unix:/var/run/php/php$PHP_VERSION-fpm.sock;
        }

        location ~ /\.ht {
                deny all;
        }
}
EOF
        sudo ln -s /etc/nginx/sites-available/localhost /etc/nginx/sites-enabled/
        sudo rm /etc/nginx/sites-enabled/default
        # sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/ # for recreate default nginx
    else
        phpExtensions
    fi

    if [[ $WEB_SERVER != '' ]]; then
        sudo service "$WEB_SERVER" restart

        sudo chmod 777 /var/www/
        sudo chmod 777 /var/www/html
        echo "<?php phpinfo();?>" >/var/www/html/info.php
        echo "go to http://localhost/info.php "
        echo ''
    fi
else
    echo "$COMMAND_NAME install ok installed"
fi
