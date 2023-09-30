#!/bin/bash

echo "=========================== MariaDB ==========================="
REQUIRED_PKG="mariadb-server"
PKG_OK=$(dpkg-query -W --showformat='${Status}\n' $REQUIRED_PKG | grep "install ok installed")
echo Checking for $REQUIRED_PKG: "$PKG_OK"
if [ "" = "$PKG_OK" ]; then
    echo "No $REQUIRED_PKG. Setting up $REQUIRED_PKG."
    sudo apt install -y software-properties-common mariadb-server mariadb-client
    echo "***********Set up some information***********"
    echo "****** run: mysql_secure_installation *******"
    echo "*********************************************"
    echo "
# NOTE: RUNNING ALL PARTS OF THIS SCRIPT IS RECOMMENDED FOR ALL MariaDBSERVERS IN PRODUCTION USE!  PLEASE READ EACH STEP CAREFULLY!
#
# In order to log into MariaDB to secure it, we'llneed the current password for the root user.  If you've just installed MariaDB, and
# you haven't set the root password yet, the password will be blank, so you should just press enter here.
#
# Enter current password for root (enter for none):
# OK, successfully used password, moving on...
#
# Setting the root password ensures that nobody can log into the MariaDB root user without the proper authorisation.
#
# Set root password? [Y/n] y
# New password:
# Re-enter new password:
# Password updated successfully!
# Reloading privilege tables..
#  ... Success!
#
#
# By default, a MariaDB installation has an anonymous user, allowing anyone to log into MariaDB without having to have a user account created for
# them.  This is intended only for testing, and to make the installation go a bit smoother.  You should remove them before moving into a
# production environment.
#
# Remove anonymous users? [Y/n] y
#  ... Success!
#
# Normally, root should only be allowed to connect from 'localhost'.  This
# ensures that someone cannot guess at the root password from the network.
#
# Disallow root login remotely? [Y/n] y
#  ... Success!
#
# By default, MariaDB comes with a database named 'test' that anyone can
# access.  This is also intended only for testing, and should be removed
# before moving into a production environment.
#
# Remove test database and access to it? [Y/n] y
#  - Dropping test database...
#  ... Success!
#  - Removing privileges on test database...
#  ... Success!
#
# Reloading the privilege tables will ensure that all changes made so far
# will take effect immediately.
#
# Reload privilege tables now? [Y/n] y
#  ... Success!
#
# Cleaning up...
#
# All done!  If you've completed all of the above steps, your MariaDB
# installation should now be secure.
"
    echo "*********************************************"
    echo "read notes to change mysql security"
    #mysql_secure_installation
    sudo mysql -u root -e "use mysql; set password for 'root'@'localhost' = password('root'); flush privileges;"
fi
echo ''
