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
    echo ''
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
    sudo apt install php$PHP_VERSION php$PHP_VERSION-common php$PHP_VERSION-mysql php$PHP_VERSION-curl php$PHP_VERSION-gd php$PHP_VERSION-redis php$PHP_VERSION-mbstring php$PHP_VERSION-xml php$PHP_VERSION-zip -y
    sudo a2enmod php$PHP_VERSION
    sudo a2enmod ssl
    sudo systemctl reload apache2
    sudo chmod 777 /var/www/
    sudo chmod 777 /var/www/html
    echo "<?php phpinfo();?>" >/var/www/html/info.php
    echo "go to http://localhost/info.php "
    echo ''
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
    sudo wget https://github.com/FiloSottile/mkcert/releases/download/v1.4.3/mkcert-v1.4.3-linux-amd64
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
