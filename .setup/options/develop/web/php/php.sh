#!/bin/bash

WEB_SERVER=$1

echo "=========================== PHP ==========================="
COMMAND_NAME="php"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."

    # check and set WEB_SERVER if not set
    if [ -x "$(command -v nginx)" ]; then
        WEB_SERVER="nginx"
    elif [ -x "$(command -v apache2)" ]; then
        WEB_SERVER="apache2"
    fi

    if [[ $WEB_SERVER == '' ]]; then
        PS3="Still not set web server now, please select web server: "
        select opt in "nginx" "apache2"; do
            case $opt in
            "nginx")
                WEB_SERVER="nginx"
                break
                ;;
            "apache2")
                WEB_SERVER="apache2"
                break
                ;;
            *)
                echo "Invalid option $REPLY"
                ;;
            esac
        done
    fi

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
    PS3="Press * to setup default version - php$PHP_VERSION (latest version is php$PHP_VERSION) \n Select setup the php version (Warning: choose new version may not be successful because it is not yet complete support, please choose the stable version): "
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
        sudo apt install php"$PHP_VERSION" php"$PHP_VERSION"-{common,mysql,curl,gd,redis,mbstring,xml,zip,readline,bcmath,intl,json,opcache,soap,sqlite3,xmlrpc,xsl,imagick,dev,cli} -y
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
