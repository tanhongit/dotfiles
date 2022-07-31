echo '####################################################################'
echo '####################################################################'
echo '############################ For Ubuntu ############################'
echo '####################################################################'
echo '####################################################################'
echo ''
echo "=========================== update ==========================="
sudo apt-get -y update
sudo apt-get -y upgrade

REQUIRED_PKG="git"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: $PKG_OK
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt-get install -y $REQUIRED_PKG
fi

mkdir ~/.themes
sudo git clone https://github.com/B00merang-Project/macOS ~/.themes/macOS-master
mkdir ~/.icons
sudo git clone https://github.com/keeferrourke/la-capitaine-icon-theme ~/.icons/la-capitaine-icon-theme-0.6.1