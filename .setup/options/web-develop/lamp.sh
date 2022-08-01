
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
    systemctl status $REQUIRED_PKG
fi

echo "=========================== MariaDB ==========================="
REQUIRED_PKG="mariadb-server"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y software-properties-common mariadb-server mariadb-client
fi

echo "=========================== PHP ==========================="
REQUIRED_PKG="php"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install lsb-release ca-certificates apt-transport-https software-properties-common -y
    echo "*****************"
    echo "***Press Enter***"
    echo "*****************"
    sudo add-apt-repository ppa:ondrej/php
    PHP_VERSION=8.1
    sudo apt install php$PHP_VERSION php$PHP_VERSION-fpm php$PHP_VERSION-common php$PHP_VERSION-mysql php$PHP_VERSION-curl php$PHP_VERSION-gd php$PHP_VERSION-redis php$PHP_VERSION-mbstring php$PHP_VERSION-xml php$PHP_VERSION-zip -y
    a2enmod php$PHP_VERSION
    sudo systemctl reload apache2 
    echo "<?php phpinfo();?>" > /var/www/html/info.php
    echo "go to http://localhost/info.php "
fi

