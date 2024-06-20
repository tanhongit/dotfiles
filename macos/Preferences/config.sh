#!/bin/bash

# For Path: /Libraries/Preferences/

# ===================== Finder ===================== #
defaults write com.apple.finder AppleShowAllFiles -bool true
defaults write com.apple.finder ShowPathbar -bool true
defaults write com.apple.finder ShowStatusBar -bool true
defaults write com.apple.finder ContainerShowSidebar -bool true
defaults write com.apple.finder ShowToolbar -bool true
defaults write com.apple.finder ShowSidebar -bool true
defaults write com.apple.finder ShowPreviewPane -bool true
defaults write com.apple.finder ShowTabView -bool true
defaults write com.apple.finder ShowRecentTags -bool false
defaults write com.apple.finder ShowHardDrivesOnDesktop -bool false
defaults write com.apple.finder ShowExternalHardDrivesOnDesktop -bool true

defaults write com.apple.finder NewWindowTarget -string "PfHm"
defaults write com.apple.finder NewWindowTargetPath -string "file://${HOME}/"

defaults write com.apple.finder FXPreferredViewStyle -string "Nlsv" # Nlsv, clmv, Flwv, icnv (This is the icon view)
defaults write com.apple.finder FXPreferredSearchViewStyle -string "Nlsv"
defaults write com.apple.finder FXPreferredGroupBy -string "Kind"
defaults write com.apple.finder FXPreferredSortBy -string "Name"

# when performing a search, search the current folder by default
defaults write com.apple.finder FXDefaultSearchScope -string "SCcf"

# remove items from the trash after 30 days
defaults write com.apple.finder FXRemoveOldTrashItems -bool true

# show all filename extensions
defaults write NSGlobalDomain AppleShowAllExtensions -bool true

# show warning before emptying the Trash
defaults write com.apple.finder WarnOnEmptyTrash -bool true

killall Finder

# ===================== Dock ===================== #
defaults write com.apple.dock autohide -bool false
defaults write com.apple.dock expose-group-apps -bool false
defaults write com.apple.dock largesize -float 60
defaults write com.apple.dock magnification -bool true
defaults write com.apple.dock mineffect -string "genie"
defaults write com.apple.dock minimize-to-application -bool true
defaults write com.apple.dock mru-spaces -bool false
defaults write com.apple.dock orientation -string "bottom"
defaults write com.apple.dock show-process-indicators -bool true
defaults write com.apple.dock show-recents -bool false
defaults write com.apple.dock showAppExposeGestureEnabled -bool true
defaults write com.apple.dock tilesize -float 45
defaults write com.apple.dock trash-full -bool true
defaults write com.apple.dock wvous-bl-corner -int 2
defaults write com.apple.dock wvous-bl-modifier -int 0
defaults write com.apple.dock wvous-br-corner -int 14
defaults write com.apple.dock wvous-tl-corner -int 1
defaults write com.apple.dock wvous-tl-modifier -int 0
defaults write com.apple.dock wvous-tr-corner -int 1
defaults write com.apple.dock wvous-tr-modifier -int 1048576
defaults write com.apple.dock workspaces-swoosh-animation-off -bool false
killall Dock

# ===================== Maccy ===================== #
# Maccy is a clipboard manager for macOS
# defaults read org.p0deje.Maccy
if [[ -d "/Applications/Maccy.app" ]]; then
    defaults write org.p0deje.Maccy historySize 999
    defaults write org.p0deje.Maccy menuIcon clipboard
    defaults write org.p0deje.Maccy sortBy lastCopiedAt
    defaults write org.p0deje.Maccy showSpecialSymbols 1
    defaults write org.p0deje.Maccy popupPosition cursor
    defaults write org.p0deje.Maccy hideFooter 0
    defaults write org.p0deje.Maccy hideSearch 0
    defaults write org.p0deje.Maccy hideTitle 0
    echo "Maccy is configured"
fi

# ===================== Rectangle ===================== #
# Rectangle is a window management app for macOS
# defaults read com.knollsoft.Rectangle
if [[ -d "/Applications/KeepingYouAwake.app" ]]; then
    defaults write com.knollsoft.Rectangle SUEnableAutomaticChecks 1
    defaults write com.knollsoft.Rectangle SUHasLaunchedBefore 1
    defaults write com.knollsoft.Rectangle SUHasLaunchedSinceUpdate 1
    defaults write com.knollsoft.Rectangle launchOnLogin 1
    defaults write com.knollsoft.Rectangle hideMenubarIcon 0
    defaults write com.knollsoft.Rectangle moveCursorAcrossDisplays 1
    defaults write com.knollsoft.Rectangle doubleClickTitleBar 3
    defaults write com.knollsoft.Rectangle allowAnyShortcut 1
    defaults write com.knollsoft.Rectangle alternateDefaultShortcuts 1
fi

# ===================== keepyouawake ===================== #
# keepyouawake is a menu bar app to prevent your Mac from going to sleep
# defaults read info.marcel-dierkes.KeepingYouAwake
if [[ -d "/Applications/KeepingYouAwake.app" ]]; then
    defaults write info.marcel-dierkes.KeepingYouAwake SUEnableAutomaticChecks 1
    defaults write info.marcel-dierkes.KeepingYouAwake SUHasLaunchedBefore 1
    defaults write info.marcel-dierkes.KeepingYouAwake "info.marcel-dierkes.KeepingYouAwake.BatteryCapacityThreshold" -int 25
    defaults write info.marcel-dierkes.KeepingYouAwake "info.marcel-dierkes.KeepingYouAwake.BatteryCapacityThresholdEnabled" -int 1
    defaults write info.marcel-dierkes.KeepingYouAwake "info.marcel-dierkes.KeepingYouAwake.LowPowerModeMonitoringEnabled" -int 1
    killall KeepingYouAwake
fi
