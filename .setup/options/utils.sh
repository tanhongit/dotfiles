UTILS_PACKAGE_LIST=("wine-stable" "vlc" "timeshift")

for packageName in "${UTILS_PACKAGE_LIST[@]}"; do
    echo "=========================== $packageName ==========================="
    REQUIRED_PKG=$packageName
    PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
    echo Checking for $REQUIRED_PKG: $PKG_OK
    if [ "" = "$PKG_OK" ]; then
        echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
        sudo apt-get install -y $REQUIRED_PKG
    fi
    echo ""
done

UTILS_PACKAGE_LIST=("obs-studio" "rambox" "skype" "telegram-desktop")
for packageName in "${UTILS_PACKAGE_LIST[@]}"; do
    echo "=========================== $packageName ==========================="
    if ! command -v $packageName &>/dev/null; then
        echo "$packageName could not be found. Setting up $packageName."
        while true; do
            read -p "Do you wish to install this program? (Y/N)  " yn
            case $yn in
            [Yy]*)
                sudo snap install $packageName
                break
                ;;
            [Nn]*) break ;;
            *) echo "Please answer yes or no." ;;
            esac
        done
    else
        echo "$packageName install ok installed"
    fi
    echo ""
done
