/**
 * Extension
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2023
 * @license    GPL-3.0-only
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {API, Manager} = Me.imports.lib;
const {GObject, GLib, Gio, St, Clutter, Meta} = imports.gi;

const Util = imports.misc.util;
const Config = imports.misc.config;
const shellVersion = parseFloat(Config.PACKAGE_VERSION);

const Main = imports.ui.main;
const BackgroundMenu = imports.ui.backgroundMenu;
const OverviewControls = imports.ui.overviewControls;
const WorkspaceSwitcherPopup = imports.ui.workspaceSwitcherPopup;
const SwitcherPopup = imports.ui.switcherPopup;
const WorkspaceThumbnail = imports.ui.workspaceThumbnail;
const SearchController = imports.ui.searchController;
const Panel = imports.ui.panel;
const WorkspacesView = imports.ui.workspacesView;
const WindowPreview = imports.ui.windowPreview;
const Workspace = imports.ui.workspace;
const LookingGlass = imports.ui.lookingGlass;
const MessageTray = imports.ui.messageTray;
const OSDWindow = imports.ui.osdWindow;
const WindowMenu = imports.ui.windowMenu;
const AltTab = imports.ui.altTab;

let manager;
let api;

/**
 * initiate extension
 *
 * @returns {void}
 */
function init()
{
}

/**
 * enable extension
 *
 * @returns {void}
 */
function enable()
{
    // Some old GNOME Shells can crash on enable while those versions are not
    // supported. To avoid bad experience for those versions we simply `return`
    if (shellVersion < 42) {
        return;
    }

    let InterfaceSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});

    api = new API.API({
        Main,
        BackgroundMenu,
        OverviewControls,
        WorkspaceSwitcherPopup,
        SwitcherPopup,
        InterfaceSettings,
        SearchController,
        WorkspaceThumbnail,
        WorkspacesView,
        Panel,
        WindowPreview,
        Workspace,
        LookingGlass,
        MessageTray,
        OSDWindow,
        WindowMenu,
        AltTab,
        St,
        Gio,
        GLib,
        Clutter,
        Util,
        Meta,
        GObject,
    }, shellVersion);

    api.open();

    let settings = ExtensionUtils.getSettings();

    manager = new Manager.Manager({
        API: api,
        Settings: settings,
    }, shellVersion);

    manager.registerSettingsSignals();
    manager.applyAll();
}

/**
 * disable extension
 *
 * @returns {void}
 */
function disable()
{
    manager?.revertAll();
    manager = null;

    api?.close();
    api = null;
}

