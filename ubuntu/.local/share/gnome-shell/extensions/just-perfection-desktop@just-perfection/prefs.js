/**
 * Prefs Dialog
 *
 * @author     Javad Rahmatzadeh <j.rahmatzadeh@gmail.com>
 * @copyright  2020-2023
 * @license    GPL-3.0-only
 */

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const {Prefs, PrefsKeys} = Me.imports.lib.Prefs;
const {Gtk, Gdk, Gio, GLib} = imports.gi;

const Config = imports.misc.config;
const shellVersion = parseFloat(Config.PACKAGE_VERSION);

const gettextDomain = Me.metadata['gettext-domain'];

/**
 * references window initiation
 *
 * @returns {void}
 */
function init()
{
    ExtensionUtils.initTranslations();
}

/**
 * fill preferences window
 *
 * @returns {void}
 */
function fillPreferencesWindow(window)
{
    let UIFolderPath = Me.dir.get_child('ui').get_path();
    let prefsKeys = new PrefsKeys.PrefsKeys(shellVersion);

    let prefs = new Prefs.Prefs(
        {
            Builder: new Gtk.Builder(),
            Settings: ExtensionUtils.getSettings(),
            Gtk,
            Gdk,
            Gio,
            GLib,
        },
        prefsKeys,
        shellVersion
    );

    prefs.fillPrefsWindow(window, UIFolderPath, gettextDomain);
}
