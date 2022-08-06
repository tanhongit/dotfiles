# clone tool create virtual host
sudo git clone https://github.com/tanhongit/Apache-Virtual-Hosts-Creator.git ${ZSH_CUSTOM:-$HOME}/plugins/avhc_tool

echo '####################################################################'
echo '############################### lamp ###############################'
echo ''
bash lamp.sh

echo "=========================== phpmyadmin ==========================="
REQUIRED_PKG="phpmyadmin"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y $REQUIRED_PKG php-json
    sudo phpenmod mbstring
    sudo systemctl restart apache2
fi
echo ''

installAptDevPackages() {
    PACKAGE_LIST=("filezilla" "software-properties-common" "apt-transport-https" "gpg")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        REQUIRED_PKG=$packageName
        PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
        echo Checking for $REQUIRED_PKG: $PKG_OK
        if [ "" = "$PKG_OK" ]; then
            echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
            sudo apt install -y $REQUIRED_PKG
        fi
        echo ""
    done
}
installAptDevPackages

installSnapDevPackages() {
    PACKAGE_LIST=("postman" "mysql-workbench-community" "dbeaver-ce" "ngrok")

    for packageName in "${PACKAGE_LIST[@]}"; do
        echo "=========================== $packageName ==========================="
        COMMAND_NAME=$packageName
        if ! command -v $COMMAND_NAME &>/dev/null; then
            echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
            sudo snap install $COMMAND_NAME
        else
            echo "$COMMAND_NAME install ok installed"
        fi
        echo ""
    done
}
installSnapDevPackages

echo "=========================== vs code ==========================="
COMMAND_NAME="code"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt-get install wget gpg
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor >packages.microsoft.gpg
    sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings
    sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
    rm -f packages.microsoft.gpg
    sudo apt update
    sudo apt install code # or code-insiders
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

echo "=========================== composer ==========================="
COMMAND_NAME="composer"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt install curl unzip -y
    curl -sS https://getcomposer.org/installer -o /tmp/composer-setup.php
    HASH=$(curl -sS https://composer.github.io/installer.sig)
    php -r "if (hash_file('SHA384', '/tmp/composer-setup.php') === '$HASH') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;"
    sudo php /tmp/composer-setup.php --install-dir=/usr/local/bin --filename=composer
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

echo "=========================== localtunnel ==========================="
PACKAGE_NAME='localtunnel'
if [[ "$(npm list -g $PACKAGE_NAME)" =~ "empty" ]]; then
    echo "$PACKAGE_NAME could not be found. Setting up $PACKAGE_NAME."
    sudo npm install -g $PACKAGE_NAME
else
    echo "$PACKAGE_NAME is already installed"
fi
echo "how it works : lt --port 8000"
echo ""

echo "=========================== mongodb ==========================="
while true; do
    read -p "Do you want to install mongodb ? (Y/N)  " yn
    MONGODB_VERSION="4.2"
    case $yn in
    [Yy]*)
        sudo apt remove --autoremove mongodb-org
        sudo rm /etc/apt/sources.list.d/mongodb*.list
        sudo apt update
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 4B7C549A058F8B6B
        echo "deb [arch=amd64] http://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/$MONGODB_VERSION multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-$MONGODB_VERSION.list
        sudo apt update
        sudo apt install mongodb-org

        sudo systemctl enable mongod.service
        sudo systemctl start mongod.service
        break
        ;;
    [Nn]*) break ;;
    *) echo "Please answer yes or no." ;;
    esac
done
