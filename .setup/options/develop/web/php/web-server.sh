#!/bin/bash

setWebServer() {
    WEB_SERVER=$1
    echo "You choose $WEB_SERVER"
}
select sOption in "apache2" "nginx"; do
    case $sOption in
    "apache2")
        setWebServer "apache2"
        break
        ;;
    "nginx")
        setWebServer "nginx"
        break
        ;;
    *)
        echo "Invalid option $REPLY"
        echo "Auto set default: $WEB_SERVER"
        break
        ;;
    esac
done

if [ "$WEB_SERVER" = "apache2" ]; then
    echo "=========================== apache2 ==========================="
    REQUIRED_PKG="apache2"
    PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
    echo "Checking for $REQUIRED_PKG: $PKG_OK"
    if [ "" = "$PKG_OK" ]; then
        echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
        sudo apt install -y $REQUIRED_PKG
        systemctl enable $REQUIRED_PKG
        sudo ufw allow in "Apache Full"
        systemctl reload $REQUIRED_PKG
    fi
elif [ "$WEB_SERVER" = "nginx" ]; then
    echo "=========================== nginx ==========================="
    REQUIRED_PKG="nginx"
    PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
    echo "Checking for $REQUIRED_PKG: $PKG_OK"
    if [ "" = "$PKG_OK" ]; then
        echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
        sudo apt install -y $REQUIRED_PKG
        systemctl enable $REQUIRED_PKG
        sudo ufw allow in "Nginx Full"
        systemctl reload $REQUIRED_PKG
    fi
else
    echo "Web server is not set"
fi

bash mariadb.sh
bash php.sh "$WEB_SERVER"
