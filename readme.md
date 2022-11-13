# Welcome to dotfiles installation script for Linux by tanhongit. 

This script will install dotfiles to your system. It also will install some useful tools, packages, and programs.

After installed Ubuntu, you can run this script to install dotfiles. I added some programs, packages, and tools to this script. All of them need to be installed for Ubuntu.

It's a simple script, so you can run it easily.

# 1. Requirements
You will need to have an Ubuntu or Debian based system.

For Ubuntu, you should use the version 22.04 or higher.

# 2. Installing

Before run this script, please clone the repository to your local machine.

```bash
git clone https://github.com/tanhongit/dotfiles.git
cd dotfiles
```

Then, run the following command to install dotfiles.

```bash
cd .setup
bash setup.sh
```

Now, wait for a while, and you will see some messages question do you want to install some tools? If you want to install some tools, please answer **yes(y)**.

# Screenshots demo

![image](https://user-images.githubusercontent.com/35853002/182054188-3a72f5a2-4907-44e4-9022-1f76486455d7.png)

![image](https://user-images.githubusercontent.com/35853002/182054231-0c39f944-60af-41de-89d6-9201a52fbc94.png)

![image](https://user-images.githubusercontent.com/35853002/182054435-00088fbd-dffd-430f-88ab-f7265d029cd9.png)

![image](https://user-images.githubusercontent.com/35853002/198906288-7603e985-c22c-49bd-b60e-5c515d415a25.png)

![image](https://user-images.githubusercontent.com/35853002/182054403-677c1724-4ed8-4ce3-9a6f-c8ac707de322.png)

# 4. Backup your dotfiles from your local machine

If you want to backup your dotfiles from your local machine, please run the following command.

```bash
cd .backup
bash run.sh
```

Please wait for a while, it will take some time to backup your dotfiles. When you are ready, you can run the following command from step 2 to restore your dotfiles.
