# clone tool create virtual host
sudo git clone https://github.com/tanhongit/Apache-Virtual-Hosts-Creator.git ${ZSH_CUSTOM:-$HOME}/tools/avhc_tool

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

echo "===================== config for workbrench ==================="
sudo snap connect mysql-workbench-community:password-manager-service :password-manager-service

echo "=========================== vs code ==========================="
COMMAND_NAME="code"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo apt-get install -y wget gpg
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

echo "=========================== phpstorm ==========================="
COMMAND_NAME="phpstorm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo snap install $COMMAND_NAME
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

echo "=========================== nvm ==========================="
COMMAND_NAME="nvm"
if ! command -v $COMMAND_NAME &>/dev/null; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    curl https://raw.githubusercontent.com/creationix/nvm/master/install.sh | bash
    source ~/.profile
    reset
    # nvm install node
    # nvm install 18.7.0
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

echo "=========================== vite ==========================="
COMMAND_NAME="vite"
if ! command -v $COMMAND_NAME &>/dev/null; then
    sudo apt-get install -y $COMMAND_NAME
else
    echo "$COMMAND_NAME install ok installed"
fi
echo ""

echo "=========================== influxdb ==========================="
REQUIRED_PKG="influxdb"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    echo 'docs: https://docs.influxdata.com/influxdb/v1.7/introduction/installation/#'
    wget -qO- https://repos.influxdata.com/influxdb.key | sudo apt-key add -
    source /etc/lsb-release
    echo "deb https://repos.influxdata.com/${DISTRIB_ID,,} ${DISTRIB_CODENAME} stable" | sudo tee /etc/apt/sources.list.d/influxdb.list

    sudo apt-get update && sudo apt-get install influxdb -y
    sudo service influxdb start
    lsof -i :8086
fi
echo ""

# echo "=========================== mongodb ==========================="
# COMMAND_NAME="mongo"
# if ! command -v $COMMAND_NAME &>/dev/null; then
#     while true; do
#         read -p "Do you want to install mongodb ? (Y/N)  " yn
#         case $yn in
#         [Yy]*)
#             INSTALL_MONGODB="1"
#             break
#             ;;
#         [Nn]*) break ;;
#         *) echo "Please answer yes or no." ;;
#         esac
#     done
# else
#     INSTALL_MONGODB="0"
#     echo "$COMMAND_NAME install ok installed"
# fi
# echo ""

# if [ "1" = "$INSTALL_MONGODB" ]; then
#     sudo apt-get install gnupg -y
#     sudo apt remove --autoremove mongodb-org
#     sudo rm /etc/apt/sources.list.d/mongodb*.list
#     sudo apt update
#     # http://keyserver.ubuntu.com/pks/lookup?search=mongodb&fingerprint=on&op=index
#     MONGODB_VERSION="4.2"
#     KEYSERVER="4B7C549A058F8B6B"

#     setMongoDBVersion() {
#         MONGODB_VERSION=$1
#         KEYSERVER=$2
#     }

#     # select opt in "4.2" "4.4" "4.8" "5.0"; do
#     select opt in "4.2"; do
#         case $opt in
#         "4.2")
#             setMongoDBVersion "4.2" "4B7C549A058F8B6B"
#             break
#             ;;
#         # "4.4")
#         #     setMongoDBVersion "4.4" "656408E390CFB1F5"
#         #     break
#         #     ;;
#         # "4.8")
#         #     setMongoDBVersion "4.8" "0EBB00BA3BC3DCCB"
#         #     break
#         #     ;;
#         # "5.0")
#         #     setMongoDBVersion "5.0" "B00A0BD1E2C63C11"
#         #     break
#         #     ;;
#         *)
#             echo "Invalid option $REPLY"
#             echo "Auto set default vesion: $MONGODB_VERSION"
#             break
#             ;;
#         esac
#     done
#     sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv $KEYSERVER
#     echo "deb [arch=amd64] http://repo.mongodb.org/apt/ubuntu bionic/mongodb-org/$MONGODB_VERSION multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-$MONGODB_VERSION.list
#     sudo apt update
#     sudo apt install mongodb-org -y

#     sudo systemctl enable mongod.service
#     sudo systemctl start mongod.service
# fi
