echo '####################################################################'
echo '####################################################################'
echo '############################ For Ubuntu ############################'
echo '####################################################################'
echo '####################################################################'
echo ''
echo "=========================== update ==========================="
sudo apt-get -y update
sudo apt-get -y upgrade

sudo apt-get install -y git

mkdir ~/.themes
sudo git clone https://github.com/B00merang-Project/macOS ~/.themes/macOS-light
mkdir ~/.icons
sudo git clone https://github.com/keeferrourke/la-capitaine-icon-theme ~/.icons/la-capitaine-icon-theme-0.6.1