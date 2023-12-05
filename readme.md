# Welcome to the dotfiles installation script for Linux by tanhongit. 

This script will install dotfiles to your system. It also will install some useful tools, packages, and programs.

After installing Ubuntu, you can run this script to install dotfiles. I added some programs, packages, and tools to this script. All of them need to be installed for Ubuntu.

It's a simple script, so you can run it easily.

[![Build Status](https://github.com/tanhongit/dotfiles/actions/workflows/test_ubuntu.yml/badge.svg)](https://github.com/tanhongit/dotfiles/actions/workflows/test_ubuntu.yml)

# Information

- Platform: Linux
- OS: Ubuntu
- Language: Bash
- Plash: GNOME
- Shell: ZSH

# Requirements

You will need to have an Ubuntu or Debian-based system.

For Ubuntu, you should use version 22.04 or higher.

# Installing

Before running this script, please clone the repository to your local machine.

```bash
git clone https://github.com/tanhongit/dotfiles.git
cd dotfiles
```

Then, run the following command to install dotfiles.

```bash
cd .setup
bash install.sh
```

Now, wait for a while, and you will see some messages questioning do you want to install some tools. If you want to install some tools, please answer **yes(y)**.

# Screenshots demo

![image](https://user-images.githubusercontent.com/35853002/235287944-1c092521-1c75-4fc6-a03b-8fb1a17efd8d.png)

![image](https://user-images.githubusercontent.com/35853002/235287809-452e05d0-60dc-4960-a56f-2babe883c026.png)

![image](https://user-images.githubusercontent.com/35853002/235287770-47cb0775-8889-4a37-b40b-2bc3ec0d66e5.png)

![image](https://user-images.githubusercontent.com/35853002/235287734-0f8d8c00-bd12-4ae7-acb8-b4f440bdf50f.png)

![image](https://user-images.githubusercontent.com/35853002/235287704-a6c5835b-c08d-4424-8e98-30bee2d5bbda.png)

# Backup your dotfiles from your local machine

If you want to back up your dotfiles from your local machine, please run the following command.

```bash
cd .backup
bash run.sh
```

Please wait for a while, it will take some time to back up your dotfiles. When you are ready, you can run the following command from Step 2 to restore your dotfiles.
