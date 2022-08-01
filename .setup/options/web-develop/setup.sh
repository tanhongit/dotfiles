# clone tool create virtual host 
sudo git clone https://github.com/tanhongit/Apache-Virtual-Hosts-Creator.git ${ZSH_CUSTOM:-$HOME}/plugins/avhc_tool

echo "=========================== filezilla ==========================="
REQUIRED_PKG="filezilla"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y $REQUIRED_PKG
fi

echo "=========================== Postman ==========================="
COMMAND_NAME="postman"
if ! command -v $COMMAND_NAME &> /dev/null
then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo snap install -y $COMMAND_NAME
fi

# echo "=========================== mysql workbench ==========================="
# sudo snap install -y mysql-workbench-community 