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
# defaults read com.apple.dock
defaults write com.apple.dock expose-group-apps -bool false
defaults write com.apple.dock magnification -bool true
defaults write com.apple.dock mineffect -string "genie"
defaults write com.apple.dock minimize-to-application -bool true
defaults write com.apple.dock "mru-spaces" -bool true
defaults write com.apple.dock orientation -string "bottom"
defaults write com.apple.dock show-process-indicators -bool true
defaults write com.apple.dock show-recents -bool false
defaults write com.apple.dock showAppExposeGestureEnabled -bool true
defaults write com.apple.dock tilesize -float 45
defaults write com.apple.dock largesize -float 70
defaults write com.apple.dock trash-full -bool true
defaults write com.apple.dock wvous-bl-corner -int 2
defaults write com.apple.dock wvous-bl-modifier -int 0
defaults write com.apple.dock wvous-br-corner -int 14
defaults write com.apple.dock wvous-tl-corner -int 1
defaults write com.apple.dock wvous-tl-modifier -int 0
defaults write com.apple.dock wvous-tr-corner -int 1
defaults write com.apple.dock wvous-tr-modifier -int 1048576
defaults write com.apple.dock workspaces-swoosh-animation-off -bool false

defaults write com.apple.dock autohide -bool true
defaults write com.apple.dock autohide-delay -float 0;
defaults write com.apple.dock autohide-time-modifier -int 0;

# group windows by application in Mission Control
defaults write com.apple.dock expose-group-by-app -bool false

# double-click a window's title bar to minimize
defaults write NSGlobalDomain AppleActionOnDoubleClick -string "None"

# animate opening applications from the Dock
defaults write com.apple.dock launchanim -bool true

killall Dock

# ===================== Maccy ===================== #
# Maccy is a clipboard manager for macOS
# defaults read org.p0deje.Maccy
if [[ -d "/Applications/Maccy.app" ]]; then
    defaults write org.p0deje.Maccy historySize -int 999
    defaults write org.p0deje.Maccy menuIcon clipboard
    defaults write org.p0deje.Maccy sortBy lastCopiedAt
    defaults write org.p0deje.Maccy showSpecialSymbols -int 1
    defaults write org.p0deje.Maccy popupPosition cursor
    defaults write org.p0deje.Maccy hideFooter -int 0
    defaults write org.p0deje.Maccy hideSearch -int 0
    defaults write org.p0deje.Maccy hideTitle -int 0
    echo "Maccy is configured"
fi

# ===================== Rectangle ===================== #
# Rectangle is a window management app for macOS
# defaults read com.knollsoft.Rectangle
if [[ -d "/Applications/KeepingYouAwake.app" ]]; then
    defaults write com.knollsoft.Rectangle SUEnableAutomaticChecks -int 1
    defaults write com.knollsoft.Rectangle SUHasLaunchedBefore -int 1
    defaults write com.knollsoft.Rectangle SUHasLaunchedSinceUpdate -int 1
    defaults write com.knollsoft.Rectangle launchOnLogin -int 1
    defaults write com.knollsoft.Rectangle hideMenubarIcon -int 0
    defaults write com.knollsoft.Rectangle moveCursorAcrossDisplays -int 1
    defaults write com.knollsoft.Rectangle doubleClickTitleBar -int 3
    defaults write com.knollsoft.Rectangle allowAnyShortcut -int 1
    defaults write com.knollsoft.Rectangle alternateDefaultShortcuts -int 1
    echo "Rectangle is configured"
fi

# ===================== keepyouawake ===================== #
# keepyouawake is a menu bar app to prevent your Mac from going to sleep
# defaults read info.marcel-dierkes.KeepingYouAwake
if [[ -d "/Applications/KeepingYouAwake.app" ]]; then
    defaults write info.marcel-dierkes.KeepingYouAwake SUEnableAutomaticChecks -int 1
    defaults write info.marcel-dierkes.KeepingYouAwake SUHasLaunchedBefore -int 1
    defaults write info.marcel-dierkes.KeepingYouAwake "info.marcel-dierkes.KeepingYouAwake.BatteryCapacityThreshold" -int 25
    defaults write info.marcel-dierkes.KeepingYouAwake "info.marcel-dierkes.KeepingYouAwake.BatteryCapacityThresholdEnabled" -int 1
    defaults write info.marcel-dierkes.KeepingYouAwake "info.marcel-dierkes.KeepingYouAwake.LowPowerModeMonitoringEnabled" -int 1
    killall KeepingYouAwake
    echo "KeepingYouAwake is configured"
fi

# ===================== iTerm2 ===================== #
# iTerm2 is a terminal emulator for macOS
# defaults read com.googlecode.iterm2
if [[ -d "/Applications/iTerm.app" ]]; then
    defaults write com.googlecode.iterm2 LoadPrefsFromCustomFolder -int 1
    defaults write com.googlecode.iterm2 HideScrollbar -int 1
    defaults write com.googlecode.iterm2 SUAutomaticallyUpdate -int 1
    defaults write com.googlecode.iterm2 SUEnableAutomaticChecks -int 1
    defaults write com.googlecode.iterm2 SUHasLaunchedBefore -int 1

    # Set iTerm2 appearance settings
    # Note: These settings are applied to the default profile
    /usr/libexec/PlistBuddy -c "Set :'New Bookmarks':0:'Unlimited Scrollback' 1" ~/Library/Preferences/com.googlecode.iterm2.plist
    /usr/libexec/PlistBuddy -c "Set :'New Bookmarks':0:'Transparency' 0.45" ~/Library/Preferences/com.googlecode.iterm2.plist
    /usr/libexec/PlistBuddy -c "Set :'New Bookmarks':0:'Blur Radius' 25.0" ~/Library/Preferences/com.googlecode.iterm2.plist
    /usr/libexec/PlistBuddy -c "Set :'New Bookmarks':0:'Columns' 150" ~/Library/Preferences/com.googlecode.iterm2.plist
    /usr/libexec/PlistBuddy -c "Set :'New Bookmarks':0:'Rows' 40" ~/Library/Preferences/com.googlecode.iterm2.plist
    /usr/libexec/PlistBuddy -c "Set :'New Bookmarks':0:'Cursor Type' 1" ~/Library/Preferences/com.googlecode.iterm2.plist

    echo "iTerm2 is configured"
fi

# ===================== Terminal ===================== #
# Terminal is the default terminal emulator for macOS
# defaults read com.apple.terminal
if [[ -d "/System/Applications/Terminal.app" || -d "/Applications/Utilities/Terminal.app" ]]; then
    # Set default profile to Basic
    defaults write com.apple.terminal "Default Window Settings" -string "Basic"
    defaults write com.apple.terminal "Startup Window Settings" -string "Basic"
    
    # Enable UTF-8 in Terminal
    defaults write com.apple.terminal StringEncodings -array 4
    
    # Enable Secure Keyboard Entry
    defaults write com.apple.terminal SecureKeyboardEntry -bool true


    # Enable anti-aliased text
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:FontAntialias -bool true" ~/Library/Preferences/com.apple.Terminal.plist
    
    # Set default window size (columns x rows)
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:columnCount 150" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:rowCount 40" ~/Library/Preferences/com.apple.Terminal.plist
    
    # Enable bold text
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:UseBoldFonts -bool true" ~/Library/Preferences/com.apple.Terminal.plist
    
    # Enable ANSI color
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:UseBrightBold -bool true" ~/Library/Preferences/com.apple.Terminal.plist
    
    # Set cursor style (0 = Block, 2 = Vertical Bar, 1 = Underline)
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:CursorType 2" ~/Library/Preferences/com.apple.Terminal.plist

    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:ShowWindowSettingsNameInTitle -bool false" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:ShowTTYNameInTitle -bool false" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:ShowShellCommandInTitle -bool false" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:ShowRepresentedURLPathInTitle -bool false" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:ShowCommandKeyInTitle -bool true" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:EnableSmoothResizing -bool true" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:DisableANSIColor -int 0" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:BlinkText -int 1" ~/Library/Preferences/com.apple.Terminal.plist
    /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:BackgroundBlur -float 0.31" ~/Library/Preferences/com.apple.Terminal.plist

    # Disable audible bell
    /usr/libexec/PlistBuddy -c "Add :'Window Settings':Basic:audibleBell bool false" ~/Library/Preferences/com.apple.Terminal.plist 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:audibleBell false" ~/Library/Preferences/com.apple.Terminal.plist
    
    # Enable visual bell
    /usr/libexec/PlistBuddy -c "Add :'Window Settings':Basic:visualBell bool true" ~/Library/Preferences/com.apple.Terminal.plist 2>/dev/null || /usr/libexec/PlistBuddy -c "Set :'Window Settings':Basic:visualBell true" ~/Library/Preferences/com.apple.Terminal.plist
    
    # Set shell to use (empty for default)
    defaults write com.apple.terminal Shell -string ""
    
    # Allow sessions to survive logout
    defaults write com.apple.terminal "NSQuitAlwaysKeepsWindows" -bool false
    
    echo "Terminal is configured"
fi

# ===================== ScreenShot ===================== #
# ScreenShot is a screen capture tool for macOS
# defaults read com.apple.screencapture

mkdir -p "${HOME}/Pictures/Screenshots"

# shellcheck disable=SC2088
defaults write com.apple.screencapture location -string "~/Pictures/Screenshots"
# shellcheck disable=SC2088
defaults write com.apple.screencapture location-last -string "~/Pictures/Screenshots"

defaults write com.apple.screencapture type "png"
defaults write com.apple.screencapture disable-shadow -int 1
defaults write com.apple.screencapture show-thumbnail -int 1
defaults write com.apple.screencapture include-date -bool true
defaults write com.apple.screencapture show-include-date -bool true
defaults write com.apple.screencapture showsClicks -int 1
defaults write com.apple.screencapture showCursor -int 1

defaults write com.apple.screencapture target clipboard # file, clipboard, preview, mail, printer
echo "ScreenShot is configured"

# ===================== TextEdit ===================== #
# TextEdit is a simple text editor included with macOS
# defaults read com.apple.TextEdit
defaults write com.apple.TextEdit RichText -int 0
defaults write com.apple.TextEdit PlainTextEncoding -int 4
defaults write com.apple.TextEdit PlainTextEncodingForWrite -int 4
defaults write com.apple.TextEdit ShowRuler -int 1
echo "TextEdit is configured"

# ===================== preferences ===================== #
# defaults read NSGlobalDomain
defaults write NSGlobalDomain AppleMeasurementUnits -string "Centimeters"
defaults write NSGlobalDomain AppleMetricUnits -bool true
defaults write NSGlobalDomain AppleICUForce24HourTime -bool true
defaults write NSGlobalDomain AppleFirstWeekday -dict gregorian 2
defaults write NSGlobalDomain AppleKeyboardUIMode -int 3
defaults write NSGlobalDomain ApplePressAndHoldEnabled -bool false
defaults write NSGlobalDomain AppleShowAllExtensions -bool true
defaults write NSGlobalDomain AppleShowScrollBars -string "Always"
defaults write NSGlobalDomain AppleSpacesSwitchOnActivate -bool false
defaults write NSGlobalDomain AppleTemperatureUnit -string "Celsius"
defaults write NSGlobalDomain NSAutomaticDashSubstitutionEnabled -bool true # Smart dashes
defaults write NSGlobalDomain NSAutomaticQuoteSubstitutionEnabled -bool true # Smart quotes
defaults write NSGlobalDomain NSAutomaticSpellingCorrectionEnabled -bool true
defaults write NSGlobalDomain NSAutomaticCapitalizationEnabled -bool false
defaults write NSGlobalDomain NSCloseAlwaysConfirmsChanges -bool true
defaults write NSGlobalDomain NSSpellCheckerAutomaticallyIdentifiesLanguages -bool true
defaults write NSGlobalDomain AppleScrollerPagingBehavior -int 2
defaults write NSGlobalDomain AppleAccentColor -int 3 # Accent color (Green)
echo "Preferences is configured"

# ===================== Trackpad ===================== #
# defaults read com.apple.AppleMultitouchTrackpad
defaults write com.apple.AppleMultitouchTrackpad ActuateDetents -int 1
defaults write com.apple.AppleMultitouchTrackpad Clicking -int 1
defaults write com.apple.AppleMultitouchTrackpad DragLock -int 0
defaults write com.apple.AppleMultitouchTrackpad Dragging -int 1
defaults write com.apple.AppleMultitouchTrackpad FirstClickThreshold -int 1
defaults write com.apple.AppleMultitouchTrackpad TrackpadTwoFingerFromRightEdgeSwipeGesture -int 0
echo "Trackpad is configured"

# ===================== UnnaturalScrollWheel ===================== #
# defaults read com.theron.UnnaturalScrollWheels.plist
if [[ -d "/Applications/UnnaturalScrollWheels.app" ]]; then
    defaults write com.theron.UnnaturalScrollWheels.plist ShowMenuBarIcon -bool false
    defaults write com.theron.UnnaturalScrollWheels.plist LaunchAtLogin -bool true
    killall UnnaturalScrollWheels
    echo "UnnaturalScrollWheel is configured"
fi

# ===================== Clock Options ===================== #
# defaults read com.apple.menuextra.clock
defaults write com.apple.menuextra.clock ShowDayOfWeek -bool true
defaults write com.apple.menuextra.clock ShowSeconds -bool true

# ===================== Keyboard Options ===================== #
# defaults read NSGlobalDomain
defaults write NSGlobalDomain KeyRepeat -int 2 # key repeat fast
defaults write NSGlobalDomain InitialKeyRepeat -int 25 # key repeat fast

# ===================== Accessibility Options ===================== #
#defaults write com.apple.AppleMultitouchTrackpad TrackpadThreeFingerDrag -int 1 # Dragging style - 1: three finger drag, 0: one finger drag

# ===================== Control Center Options ===================== #
# defaults read com.apple.controlcenter
defaults write com.apple.controlcenter "NSStatusItem Visible Display" -bool true

# ===================== Calendar Options ===================== #
# defaults read com.apple.iCal
defaults write com.apple.iCal "first day of week" -int 1
defaults write com.apple.iCal "show week numbers" -bool true
defaults write com.apple.iCal "TimeZone support enabled" -bool true
