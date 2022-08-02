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
    PACKAGE_LIST=("postman" "mysql-workbench-community")

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
