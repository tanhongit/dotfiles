#!/bin/bash

echo "=========================== Web Server ==========================="
setWebServer() {
    WEB_SERVER=$1
    echo "You choose $WEB_SERVER"
}

if [ -x "$(command -v apache2)" ] || [ -x "$(command -v nginx)" ]; then
    echo "Apache2 or Nginx already installed"
else
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
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $WEB_SERVER | grep "install ok installed")
        echo "Checking for $WEB_SERVER: $PKG_OK"
        if [ "" = "$PKG_OK" ]; then
            echo "No $WEB_SERVER. Setting up $WEB_SERVER."
            sudo apt install -y $WEB_SERVER
            systemctl enable $WEB_SERVER
            sudo ufw allow in "Apache Full"
            systemctl reload $WEB_SERVER
        fi
    elif [ "$WEB_SERVER" = "nginx" ]; then
        echo "=========================== nginx ==========================="
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $WEB_SERVER | grep "install ok installed")
        echo "Checking for $WEB_SERVER: $PKG_OK"
        if [ "" = "$PKG_OK" ]; then
            echo "No $WEB_SERVER. Setting up $WEB_SERVER."
            sudo apt install -y $WEB_SERVER
            systemctl enable $WEB_SERVER
            sudo ufw allow in "Nginx Full"
            systemctl reload $WEB_SERVER
        fi
    else
        echo "Web server is not set"
    fi
fi
echo ""

bash mariadb.sh
bash php.sh "$WEB_SERVER"
