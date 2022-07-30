echo '####################################################################'
echo '####################################################################'
echo '############################ For Ubuntu ############################'
echo '####################################################################'
echo '####################################################################'
echo ''
echo "=========================== update ==========================="
sudo apt-get update
sudo apt-get upgrade

sudo apt-get install -y git

mkdir ~/.themes
sudo git clone https://github.com/B00merang-Project/macOS ~/.themes
mkdir ~/.icons
sudo git clone https://github.com/keeferrourke/la-capitaine-icon-theme ~/.icons