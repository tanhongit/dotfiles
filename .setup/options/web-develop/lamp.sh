#!/bin/bash

echo "=========================== apache2 ==========================="
REQUIRED_PKG="apache2"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y $REQUIRED_PKG
    systemctl enable $REQUIRED_PKG
    sudo ufw allow in "Apache Full"
    systemctl reload $REQUIRED_PKG
fi

echo "=========================== MariaDB ==========================="
REQUIRED_PKG="mariadb-server"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y software-properties-common mariadb-server mariadb-client
    echo "***********Set up some information***********"
    echo "****** run: mysql_secure_installation *******"
    echo "*********************************************"
    echo "
# NOTE: RUNNING ALL PARTS OF THIS SCRIPT IS RECOMMENDED FOR ALL MariaDBSERVERS IN PRODUCTION USE!  PLEASE READ EACH STEP CAREFULLY!
#
# In order to log into MariaDB to secure it, we'llneed the current password for the root user.  If you've just installed MariaDB, and
# you haven't set the root password yet, the password will be blank, so you should just press enter here.
#
# Enter current password for root (enter for none):                                                    
# OK, successfully used password, moving on...
# 
# Setting the root password ensures that nobody can log into the MariaDB root user without the proper authorisation.
# 
# Set root password? [Y/n] y
# New password:
# Re-enter new password:
# Password updated successfully!
# Reloading privilege tables..
#  ... Success!
# 
# 
# By default, a MariaDB installation has an anonymous user, allowing anyone to log into MariaDB without having to have a user account created for
# them.  This is intended only for testing, and to make the installation go a bit smoother.  You should remove them before moving into a
# production environment.
# 
# Remove anonymous users? [Y/n] y
#  ... Success!
# 
# Normally, root should only be allowed to connect from 'localhost'.  This
# ensures that someone cannot guess at the root password from the network.
# 
# Disallow root login remotely? [Y/n] y
#  ... Success!
# 
# By default, MariaDB comes with a database named 'test' that anyone can
# access.  This is also intended only for testing, and should be removed
# before moving into a production environment.
# 
# Remove test database and access to it? [Y/n] y
#  - Dropping test database...
#  ... Success!
#  - Removing privileges on test database...
#  ... Success!
# 
# Reloading the privilege tables will ensure that all changes made so far
# will take effect immediately.
# 
# Reload privilege tables now? [Y/n] y
#  ... Success!
# 
# Cleaning up...
# 
# All done!  If you've completed all of the above steps, your MariaDB
# installation should now be secure.
"
    echo "*********************************************"
    echo "read notes to change mysql security"
    #mysql_secure_installation
    sudo mysql -u root -e "use mysql; set password for 'root'@'localhost' = password('root'); flush privileges;";
fi

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

echo "=========================== libnss3-tools ==========================="
REQUIRED_PKG="libnss3-tools"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y $REQUIRED_PKG
fi

echo "=========================== mkcert ==========================="
COMMAND_NAME="mkcert"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    
    cd ~/
    wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.3/mkcert-v1.4.3-linux-amd64
    sudo mv mkcert-v1.4.3-linux-amd64 mkcert
    sudo chmod +x mkcert
    sudo cp mkcert /usr/local/bin/

    mkcert -install
    mkdir /var/www/certs
    mkdir /var/www/logs
    mkcert -cert-file /var/www/certs/localhost.pem -key-file /var/www/certs/localhost-key.pem localhost
    sudo chmod 777 /etc/apache2/sites-enabled/*
    sudo systemctl reload apache2
else
    echo "$COMMAND_NAME install ok installed"
fi
