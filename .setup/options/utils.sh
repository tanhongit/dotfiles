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

echo "=========================== obs-studio ==========================="
COMMAND_NAME="obs-studio"
if ! command -v $COMMAND_NAME &> /dev/null
then
    echo "$COMMAND_NAME could not be found. Setting up $COMMAND_NAME."
    sudo snap install $COMMAND_NAME
fi