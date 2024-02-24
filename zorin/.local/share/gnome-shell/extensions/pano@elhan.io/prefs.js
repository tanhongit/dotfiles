imports.gi.versions.Gtk = '4.0';
const Me = imports.misc.extensionUtils.getCurrentExtension();
var prefs = (function (gdk4, gtk4, adw1, gio2, pango1, gobject2, glib2) {
    'use strict';

    function __decorate(decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    }

    const createColorRow = (title, subtitle, settings, schemaKey) => {
        const colorRow = new adw1.ActionRow({
            title,
            subtitle,
        });
        const colorButton = new gtk4.ColorButton({
            title,
            valign: gtk4.Align.CENTER,
            halign: gtk4.Align.CENTER,
            use_alpha: true,
        });
        const rgba = new gdk4.RGBA();
        rgba.parse(settings.get_string(schemaKey));
        colorButton.set_rgba(rgba);
        colorButton.connect('color-set', () => {
            const color = colorButton.get_rgba();
            const colorString = color.to_string();
            settings.set_string(schemaKey, colorString);
        });
        colorRow.add_suffix(colorButton);
        colorRow.set_activatable_widget(colorButton);
        const clearButton = new gtk4.Button({
            icon_name: 'edit-clear-symbolic',
            valign: gtk4.Align.CENTER,
            halign: gtk4.Align.CENTER,
        });
        const value = settings.get_string(schemaKey);
        const defaultValue = settings.get_default_value(schemaKey)?.get_string()[0];
        if (defaultValue === value) {
            clearButton.sensitive = false;
        }
        settings.connect(`changed::${schemaKey}`, () => {
            const value = settings.get_string(schemaKey);
            if (defaultValue === value) {
                clearButton.sensitive = false;
            }
            else {
                clearButton.sensitive = true;
            }
            const rgba = new gdk4.RGBA();
            rgba.parse(value);
            colorButton.set_rgba(rgba);
        });
        clearButton.connect('clicked', () => {
            settings.reset(schemaKey);
        });
        colorRow.add_suffix(clearButton);
        return colorRow;
    };
    const createSpinRow = (title, subtitle, settings, schemaKey, increment, lower, upper) => {
        const row = new adw1.ActionRow({
            title,
            subtitle,
        });
        const value = settings.get_int(schemaKey);
        const spinButton = new gtk4.SpinButton({
            adjustment: new gtk4.Adjustment({ step_increment: increment, lower, upper }),
            value,
            valign: gtk4.Align.CENTER,
            halign: gtk4.Align.CENTER,
        });
        settings.bind(schemaKey, spinButton, 'value', gio2.SettingsBindFlags.DEFAULT);
        row.add_suffix(spinButton);
        row.set_activatable_widget(spinButton);
        const clearButton = new gtk4.Button({
            icon_name: 'edit-clear-symbolic',
            valign: gtk4.Align.CENTER,
            halign: gtk4.Align.CENTER,
        });
        const defaultValue = settings.get_default_value(schemaKey)?.get_int32();
        if (defaultValue === value) {
            clearButton.sensitive = false;
        }
        settings.connect(`changed::${schemaKey}`, () => {
            const value = settings.get_int(schemaKey);
            if (defaultValue === value) {
                clearButton.sensitive = false;
            }
            else {
                clearButton.sensitive = true;
            }
        });
        clearButton.connect('clicked', () => {
            settings.reset(schemaKey);
        });
        row.add_suffix(clearButton);
        return row;
    };
    const createFontRow = (title, subtitle, settings, schemaKey) => {
        const getFont = () => `${settings.get_string(`${schemaKey}-family`)} ${settings.get_int(`${schemaKey}-size`)}`;
        const getDefaultFont = () => `${settings.get_default_value(`${schemaKey}-family`)?.get_string()[0]} ${settings
        .get_default_value(`${schemaKey}-size`)
        ?.get_int32()}`;
        const fontRow = new adw1.ActionRow({
            title,
            subtitle,
        });
        const fontButton = new gtk4.FontButton({
            title,
            valign: gtk4.Align.CENTER,
            halign: gtk4.Align.CENTER,
            use_font: true,
            font: getFont(),
        });
        fontButton.connect('font-set', () => {
            const fontFamily = fontButton.get_font_family()?.get_name();
            const fontSize = fontButton.get_font_size() / pango1.SCALE;
            settings.set_string(`${schemaKey}-family`, fontFamily || 'Cantarell Regular');
            settings.set_int(`${schemaKey}-size`, fontSize || 11);
        });
        fontRow.add_suffix(fontButton);
        fontRow.set_activatable_widget(fontButton);
        const clearButton = new gtk4.Button({
            icon_name: 'edit-clear-symbolic',
            valign: gtk4.Align.CENTER,
            halign: gtk4.Align.CENTER,
        });
        const value = getFont();
        const defaultValue = getDefaultFont();
        if (defaultValue === value) {
            clearButton.sensitive = false;
        }
        const onChange = () => {
            const value = getFont();
            if (defaultValue === value) {
                clearButton.sensitive = false;
            }
            else {
                clearButton.sensitive = true;
            }
            fontButton.set_font(value);
        };
        settings.connect(`changed::${schemaKey}-family`, onChange);
        settings.connect(`changed::${schemaKey}-size`, onChange);
        clearButton.connect('clicked', () => {
            settings.reset(`${schemaKey}-family`);
            settings.reset(`${schemaKey}-size`);
        });
        fontRow.add_suffix(clearButton);
        return fontRow;
    };

    // Taken from https://github.com/material-shell/material-shell/blob/main/src/utils/gjs.ts
    /// Decorator function to call `GObject.registerClass` with the given class.
    /// Use like
    /// ```
    /// @registerGObjectClass
    /// export class MyThing extends GObject.Object { ... }
    /// ```
    function registerGObjectClass(target) {
        // Note that we use 'hasOwnProperty' because otherwise we would get inherited meta infos.
        // This would be bad because we would inherit the GObjectName too, which is supposed to be unique.
        if (Object.prototype.hasOwnProperty.call(target, 'metaInfo')) {
            // eslint-disable-next-line
            // @ts-ignore
            // eslint-disable-next-line
            return gobject2.registerClass(target.metaInfo, target);
        }
        else {
            // eslint-disable-next-line
            // @ts-ignore
            return gobject2.registerClass(target);
        }
    }

    const logger = (prefix) => (content) => log(`[pano] [${prefix}] ${content}`);
    const getAppDataPath = () => `${glib2.get_user_data_dir()}/${getCurrentExtension().metadata.uuid}`;
    const getDbPath = () => {
        const path = getCurrentExtensionSettings().get_string('database-location');
        if (!path) {
            return getAppDataPath();
        }
        return path;
    };
    const getCurrentExtension = () => imports.misc.extensionUtils.getCurrentExtension();
    const getCurrentExtensionSettings = () => imports.misc.extensionUtils.getSettings();
    const initTranslations = () => imports.misc.extensionUtils.initTranslations(getCurrentExtension().metadata.uuid);
    const _ = imports.gettext.domain(getCurrentExtension().metadata.uuid).gettext;
    imports.gettext.domain(getCurrentExtension().metadata.uuid).ngettext;

    let CommonStyleGroup = class CommonStyleGroup extends adw1.PreferencesGroup {
        constructor() {
            super({
                title: _('Common'),
            });
            this.settings = getCurrentExtensionSettings();
            this.add(createSpinRow(_('Window Height'), _('You can change the window height'), this.settings, 'window-height', 5, 200, 1000));
            this.add(createColorRow(_('Window Background Color'), _('You can change the window background color'), this.settings, 'window-background-color'));
            this.add(createColorRow(_('Incognito Window Background Color'), _('You can change the incognito window background color'), this.settings, 'incognito-window-background-color'));
            this.add(createColorRow(_('Active Item Border Color'), _('You can change the active item border color'), this.settings, 'active-item-border-color'));
            this.add(createColorRow(_('Hovered Item Border Color'), _('You can change the hovered item border color'), this.settings, 'hovered-item-border-color'));
        }
    };
    CommonStyleGroup = __decorate([
        registerGObjectClass
    ], CommonStyleGroup);

    let ItemExpanderRow = class ItemExpanderRow extends adw1.ExpanderRow {
        constructor(title, subtitle, iconName) {
            super({
                title,
                subtitle,
            });
            this.add_prefix(gtk4.Image.new_from_icon_name(iconName));
        }
    };
    ItemExpanderRow = __decorate([
        registerGObjectClass
    ], ItemExpanderRow);

    const PanoItemTypes = {
        LINK: { classSuffix: 'link', title: _('Link'), iconPath: 'link-symbolic.svg', iconName: 'link-symbolic' },
        TEXT: { classSuffix: 'text', title: _('Text'), iconPath: 'text-symbolic.svg', iconName: 'text-symbolic' },
        EMOJI: { classSuffix: 'emoji', title: _('Emoji'), iconPath: 'emoji-symbolic.svg', iconName: 'emoji-symbolic' },
        FILE: { classSuffix: 'file', title: _('File'), iconPath: 'file-symbolic.svg', iconName: 'file-symbolic' },
        IMAGE: { classSuffix: 'image', title: _('Image'), iconPath: 'image-symbolic.svg', iconName: 'image-symbolic' },
        CODE: { classSuffix: 'code', title: _('Code'), iconPath: 'code-symbolic.svg', iconName: 'code-symbolic' },
        COLOR: { classSuffix: 'color', title: _('Color'), iconPath: 'color-symbolic.svg', iconName: 'color-symbolic' },
    };

    let CodeItemStyleRow = class CodeItemStyleRow extends ItemExpanderRow {
        constructor() {
            super(_('Code Item Style'), _('Change the style of the code item'), PanoItemTypes.CODE.iconName);
            this.settings = getCurrentExtensionSettings().get_child('code-item');
            // create header background color row
            this.add_row(createColorRow(_('Header Background Color'), _('You can change the background color of the header'), this.settings, 'header-bg-color'));
            // create header text color row
            this.add_row(createColorRow(_('Header Text Color'), _('You can change the text color of the header'), this.settings, 'header-color'));
            // create body background color row
            this.add_row(createColorRow(_('Body Background Color'), _('You can change the background color of the body'), this.settings, 'body-bg-color'));
            // create body font row
            this.add_row(createFontRow(_('Body Font'), _('You can change the font of the body'), this.settings, 'body-font'));
            // create character length row
            this.add_row(createSpinRow(_('Character Length'), _('You can change the character length of the visible text in the body'), this.settings, 'char-length', 50, 50, 5000));
        }
    };
    CodeItemStyleRow = __decorate([
        registerGObjectClass
    ], CodeItemStyleRow);

    let ColorItemStyleRow = class ColorItemStyleRow extends ItemExpanderRow {
        constructor() {
            super(_('Color Item Style'), _('Change the style of the color item'), PanoItemTypes.COLOR.iconName);
            this.settings = getCurrentExtensionSettings().get_child('color-item');
            // create header background color row
            this.add_row(createColorRow(_('Header Background Color'), _('You can change the background color of the header'), this.settings, 'header-bg-color'));
            // create header text color row
            this.add_row(createColorRow(_('Header Text Color'), _('You can change the text color of the header'), this.settings, 'header-color'));
            // create metadata background color row
            this.add_row(createColorRow(_('Metadata Background Color'), _('You can change the background color of the metadata'), this.settings, 'metadata-bg-color'));
            // create metadata text color row
            this.add_row(createColorRow(_('Metadata Text Color'), _('You can change the text color of the metadata'), this.settings, 'metadata-color'));
            // create metadata font row
            this.add_row(createFontRow(_('Body Font'), _('You can change the font of the metadata'), this.settings, 'metadata-font'));
        }
    };
    ColorItemStyleRow = __decorate([
        registerGObjectClass
    ], ColorItemStyleRow);

    let EmojiItemStyleRow = class EmojiItemStyleRow extends ItemExpanderRow {
        constructor() {
            super(_('Emoji Item Style'), _('Change the style of the emoji item'), PanoItemTypes.EMOJI.iconName);
            this.settings = getCurrentExtensionSettings().get_child('emoji-item');
            // create header background color row
            this.add_row(createColorRow(_('Header Background Color'), _('You can change the background color of the header'), this.settings, 'header-bg-color'));
            // create header text color row
            this.add_row(createColorRow(_('Header Text Color'), _('You can change the text color of the header'), this.settings, 'header-color'));
            // create body background color row
            this.add_row(createColorRow(_('Body Background Color'), _('You can change the background color of the body'), this.settings, 'body-bg-color'));
            // create character length row
            this.add_row(createSpinRow(_('Emoji Size'), _('You can change the emoji size'), this.settings, 'emoji-size', 1, 10, 300));
        }
    };
    EmojiItemStyleRow = __decorate([
        registerGObjectClass
    ], EmojiItemStyleRow);

    let FileItemStyleRow = class FileItemStyleRow extends ItemExpanderRow {
        constructor() {
            super(_('File Item Style'), _('Change the style of the file item'), PanoItemTypes.FILE.iconName);
            this.settings = getCurrentExtensionSettings().get_child('file-item');
            // create header background color row
            this.add_row(createColorRow(_('Header Background Color'), _('You can change the background color of the header'), this.settings, 'header-bg-color'));
            // create header text color row
            this.add_row(createColorRow(_('Header Text Color'), _('You can change the text color of the header'), this.settings, 'header-color'));
            // create body background color row
            this.add_row(createColorRow(_('Body Background Color'), _('You can change the background color of the body'), this.settings, 'body-bg-color'));
            // create body text color row
            this.add_row(createColorRow(_('Body Text Color'), _('You can change the text color of the body'), this.settings, 'body-color'));
            // create body font row
            this.add_row(createFontRow(_('Body Font'), _('You can change the font of the body'), this.settings, 'body-font'));
        }
    };
    FileItemStyleRow = __decorate([
        registerGObjectClass
    ], FileItemStyleRow);

    let ImageItemStyleRow = class ImageItemStyleRow extends ItemExpanderRow {
        constructor() {
            super(_('Image Item Style'), _('Change the style of the image item'), PanoItemTypes.IMAGE.iconName);
            this.settings = getCurrentExtensionSettings().get_child('image-item');
            // create header background color row
            this.add_row(createColorRow(_('Header Background Color'), _('You can change the background color of the header'), this.settings, 'header-bg-color'));
            // create header text color row
            this.add_row(createColorRow(_('Header Text Color'), _('You can change the text color of the header'), this.settings, 'header-color'));
            // create body background color row
            this.add_row(createColorRow(_('Body Background Color'), _('You can change the background color of the body'), this.settings, 'body-bg-color'));
            // create metadata background color row
            this.add_row(createColorRow(_('Metadata Background Color'), _('You can change the background color of the metadata'), this.settings, 'metadata-bg-color'));
            // create metadata text color row
            this.add_row(createColorRow(_('Metadata Text Color'), _('You can change the text color of the metadata'), this.settings, 'metadata-color'));
            // create metadata font row
            this.add_row(createFontRow(_('Metadata Font'), _('You can change the font of the metadata'), this.settings, 'metadata-font'));
        }
    };
    ImageItemStyleRow = __decorate([
        registerGObjectClass
    ], ImageItemStyleRow);

    let LinkItemStyleRow = class LinkItemStyleRow extends ItemExpanderRow {
        constructor() {
            super(_('Link Item Style'), _('Change the style of the link item'), PanoItemTypes.LINK.iconName);
            this.settings = getCurrentExtensionSettings().get_child('link-item');
            // create header background color row
            this.add_row(createColorRow(_('Header Background Color'), _('You can change the background color of the header'), this.settings, 'header-bg-color'));
            // create header text color row
            this.add_row(createColorRow(_('Header Text Color'), _('You can change the text color of the header'), this.settings, 'header-color'));
            // create body background color row
            this.add_row(createColorRow(_('Body Background Color'), _('You can change the background color of the body'), this.settings, 'body-bg-color'));
            // create metadata background color row
            this.add_row(createColorRow(_('Metadata Background Color'), _('You can change the background color of the metadata'), this.settings, 'metadata-bg-color'));
            // create metadata title color row
            this.add_row(createColorRow(_('Metadata Title Color'), _('You can change the title color of the metadata'), this.settings, 'metadata-title-color'));
            // create metadata title font row
            this.add_row(createFontRow(_('Metadata Title Font'), _('You can change the font of the metadata title'), this.settings, 'metadata-title-font'));
            // create metadata description color row
            this.add_row(createColorRow(_('Metadata Description Color'), _('You can change the description color of the metadata'), this.settings, 'metadata-description-color'));
            // create metadata description font row
            this.add_row(createFontRow(_('Metadata Description Font'), _('You can change the font of the metadata description'), this.settings, 'metadata-description-font'));
            // create metadata link color row
            this.add_row(createColorRow(_('Metadata Link Color'), _('You can change the link color of the metadata'), this.settings, 'metadata-link-color'));
            // create metadata link font row
            this.add_row(createFontRow(_('Metadata Link Font'), _('You can change the font of the metadata link'), this.settings, 'metadata-link-font'));
        }
    };
    LinkItemStyleRow = __decorate([
        registerGObjectClass
    ], LinkItemStyleRow);

    let TextItemStyleRow = class TextItemStyleRow extends ItemExpanderRow {
        constructor() {
            super(_('Text Item Style'), _('Change the style of the text item'), PanoItemTypes.TEXT.iconName);
            this.settings = getCurrentExtensionSettings().get_child('text-item');
            // create header background color row
            this.add_row(createColorRow(_('Header Background Color'), _('You can change the background color of the header'), this.settings, 'header-bg-color'));
            // create header text color row
            this.add_row(createColorRow(_('Header Text Color'), _('You can change the text color of the header'), this.settings, 'header-color'));
            // create body background color row
            this.add_row(createColorRow(_('Body Background Color'), _('You can change the background color of the body'), this.settings, 'body-bg-color'));
            // create body text color row
            this.add_row(createColorRow(_('Body Text Color'), _('You can change the text color of the body'), this.settings, 'body-color'));
            // create body font row
            this.add_row(createFontRow(_('Body Font'), _('You can change the font of the body'), this.settings, 'body-font'));
            // create character length row
            this.add_row(createSpinRow(_('Character Length'), _('You can change the character length of the visible text in the body'), this.settings, 'char-length', 50, 50, 5000));
        }
    };
    TextItemStyleRow = __decorate([
        registerGObjectClass
    ], TextItemStyleRow);

    let ItemStyleGroup = class ItemStyleGroup extends adw1.PreferencesGroup {
        constructor() {
            super({
                title: _('Item Style'),
                margin_top: 10,
            });
            this.add(new LinkItemStyleRow());
            this.add(new TextItemStyleRow());
            this.add(new EmojiItemStyleRow());
            this.add(new FileItemStyleRow());
            this.add(new ImageItemStyleRow());
            this.add(new CodeItemStyleRow());
            this.add(new ColorItemStyleRow());
        }
    };
    ItemStyleGroup = __decorate([
        registerGObjectClass
    ], ItemStyleGroup);

    let CustomizationPage = class CustomizationPage extends adw1.PreferencesPage {
        constructor() {
            super({
                title: _('Customization'),
                icon_name: 'emblem-photos-symbolic',
            });
            this.add(new CommonStyleGroup());
            this.add(new ItemStyleGroup());
        }
    };
    CustomizationPage = __decorate([
        registerGObjectClass
    ], CustomizationPage);

    let ClearHistoryRow = class ClearHistoryRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Clear History'),
                subtitle: _('Clears the clipboard database and cache'),
            });
            const clearHistoryButton = new gtk4.Button({
                css_classes: ['destructive-action'],
                label: _('Clear'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            clearHistoryButton.connect('clicked', () => {
                const md = new gtk4.MessageDialog({
                    text: _('Are you sure you want to clear history?'),
                    transient_for: this.get_root(),
                    destroy_with_parent: true,
                    modal: true,
                    visible: true,
                    buttons: gtk4.ButtonsType.OK_CANCEL,
                });
                md.get_widget_for_response(gtk4.ResponseType.OK)?.add_css_class('destructive-action');
                md.connect('response', (_, response) => {
                    if (response === gtk4.ResponseType.OK) {
                        gio2.DBus.session.call('org.gnome.Shell', '/io/elhan/Pano', 'io.elhan.Pano', 'clearHistory', null, null, gio2.DBusCallFlags.NONE, -1, null, null);
                    }
                    md.destroy();
                });
            });
            this.add_suffix(clearHistoryButton);
        }
    };
    ClearHistoryRow = __decorate([
        registerGObjectClass
    ], ClearHistoryRow);

    let SessionOnlyModeRow = class SessionOnlyModeRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Session Only Mode'),
                subtitle: _('When enabled, Pano will clear all history on logout/restart/shutdown.'),
            });
            this.settings = getCurrentExtensionSettings();
            const sessionOnlySwitch = new gtk4.Switch({
                active: this.settings.get_boolean('session-only-mode'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('session-only-mode', sessionOnlySwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(sessionOnlySwitch);
            this.set_activatable_widget(sessionOnlySwitch);
        }
    };
    SessionOnlyModeRow = __decorate([
        registerGObjectClass
    ], SessionOnlyModeRow);

    let DangerZonePage = class DangerZonePage extends adw1.PreferencesPage {
        constructor() {
            super({
                title: _('Danger Zone'),
                icon_name: 'user-trash-symbolic',
            });
            const dangerZoneGroup = new adw1.PreferencesGroup();
            dangerZoneGroup.add(new SessionOnlyModeRow());
            dangerZoneGroup.add(new ClearHistoryRow());
            this.add(dangerZoneGroup);
        }
    };
    DangerZonePage = __decorate([
        registerGObjectClass
    ], DangerZonePage);

    let ExclusionGroup = class ExclusionGroup extends adw1.PreferencesGroup {
        constructor() {
            super({
                title: _('Manage Exclusions'),
                margin_top: 20,
            });
            this.settings = getCurrentExtensionSettings();
            this.exclusionRow = new adw1.ExpanderRow({
                title: _('Excluded Apps'),
                subtitle: _('Pano will stop tracking if any window from the list is focussed'),
            });
            this.exclusionButton = new gtk4.Button({
                icon_name: 'list-add-symbolic',
                css_classes: ['flat'],
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.exclusionButton.connect('clicked', () => {
                this.exclusionRow.set_expanded(true);
                this.exclusionButton.set_sensitive(false);
                this.exclusionRow.add_row(this.createEntryRow());
            });
            this.set_header_suffix(this.exclusionButton);
            this.add(this.exclusionRow);
            const savedWindowClasses = this.settings.get_strv('exclusion-list');
            savedWindowClasses.forEach((w) => this.exclusionRow.add_row(this.createExcludedApp(w)));
            if (savedWindowClasses.length > 0) {
                this.exclusionRow.set_expanded(true);
            }
        }
        createEntryRow() {
            const entryRow = new adw1.ActionRow();
            const entry = new gtk4.Entry({
                placeholder_text: _('Window class name'),
                halign: gtk4.Align.FILL,
                valign: gtk4.Align.CENTER,
                hexpand: true,
            });
            entry.connect('map', () => {
                entry.grab_focus();
            });
            const okButton = new gtk4.Button({
                css_classes: ['flat'],
                icon_name: 'emblem-ok-symbolic',
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            okButton.connect('clicked', () => {
                if (entry.get_text().trim()) {
                    this.exclusionRow.remove(entryRow);
                    this.exclusionRow.add_row(this.createExcludedApp(entry.get_text().trim()));
                    this.exclusionButton.set_sensitive(true);
                    this.settings.set_strv('exclusion-list', [
                        ...this.settings.get_strv('exclusion-list'),
                        entry.get_text().trim(),
                    ]);
                }
            });
            entry.connect('activate', () => {
                okButton.emit('clicked');
            });
            const cancelButton = new gtk4.Button({
                css_classes: ['flat'],
                icon_name: 'window-close-symbolic',
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            cancelButton.connect('clicked', () => {
                this.exclusionRow.remove(entryRow);
                this.exclusionButton.set_sensitive(true);
            });
            entryRow.add_prefix(entry);
            entryRow.add_suffix(okButton);
            entryRow.add_suffix(cancelButton);
            return entryRow;
        }
        createExcludedApp(appClassName) {
            const excludedRow = new adw1.ActionRow({
                title: appClassName,
            });
            const removeButton = new gtk4.Button({
                css_classes: ['destructive-action'],
                icon_name: 'edit-delete-symbolic',
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            removeButton.connect('clicked', () => {
                this.exclusionRow.remove(excludedRow);
                this.settings.set_strv('exclusion-list', this.settings.get_strv('exclusion-list').filter((w) => w !== appClassName));
            });
            excludedRow.add_suffix(removeButton);
            return excludedRow;
        }
    };
    ExclusionGroup = __decorate([
        registerGObjectClass
    ], ExclusionGroup);

    let DBLocationRow = class DBLocationRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Database Location'),
                subtitle: `<b>${getDbPath()}/pano.db</b>`,
            });
            this.settings = getCurrentExtensionSettings();
            this.fileChooser = new gtk4.FileChooserNative({
                modal: true,
                title: _('Choose pano database location'),
                action: gtk4.FileChooserAction.SELECT_FOLDER,
                accept_label: 'Select',
            });
            this.connect('map', () => {
                this.fileChooser.set_transient_for(this.get_root());
            });
            this.fileChooser.set_current_folder(gio2.File.new_for_path(`${getDbPath()}`));
            this.fileChooser.connect('response', (chooser, response) => {
                if (response !== gtk4.ResponseType.ACCEPT) {
                    this.fileChooser.hide();
                    return;
                }
                const dir = chooser.get_file();
                if (dir && dir.query_exists(null) && !dir.get_child('pano.db').query_exists(null)) {
                    const path = dir.get_path();
                    if (path) {
                        this.settings.set_string('database-location', path);
                    }
                }
                else {
                    const md = new gtk4.MessageDialog({
                        text: _('Failed to select directory'),
                        transient_for: this.get_root(),
                        destroy_with_parent: true,
                        modal: true,
                        visible: true,
                        buttons: gtk4.ButtonsType.OK,
                    });
                    md.connect('response', () => {
                        md.destroy();
                    });
                }
                this.fileChooser.hide();
            });
            const dbLocationButton = new gtk4.Button({
                icon_name: 'document-open-symbolic',
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            dbLocationButton.connect('clicked', () => {
                this.fileChooser.show();
            });
            this.add_suffix(dbLocationButton);
            this.set_activatable_widget(dbLocationButton);
            this.settings.connect('changed::database-location', () => {
                this.fileChooser.set_current_folder(gio2.File.new_for_path(`${getDbPath()}`));
                this.set_subtitle(`<b>${getDbPath()}/pano.db</b>`);
            });
        }
    };
    DBLocationRow = __decorate([
        registerGObjectClass
    ], DBLocationRow);

    let HistoryLengthRow = class HistoryLengthRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('History Length'),
                subtitle: _('You can limit your clipboard history length between 10 - 500'),
            });
            this.settings = getCurrentExtensionSettings();
            const historyEntry = new gtk4.SpinButton({
                adjustment: new gtk4.Adjustment({ step_increment: 10, lower: 10, upper: 500 }),
                value: this.settings.get_int('history-length'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('history-length', historyEntry, 'value', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(historyEntry);
            this.set_activatable_widget(historyEntry);
        }
    };
    HistoryLengthRow = __decorate([
        registerGObjectClass
    ], HistoryLengthRow);

    let IncognitoShortcutRow = class IncognitoShortcutRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Incognito Mode Shortcut'),
                subtitle: _('Allows you to toggle incognito mode'),
            });
            this.settings = getCurrentExtensionSettings();
            const shortcutLabel = new gtk4.ShortcutLabel({
                disabled_text: _('Select a shortcut'),
                accelerator: this.settings.get_strv('incognito-shortcut')[0],
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.connect('changed::incognito-shortcut', () => {
                shortcutLabel.set_accelerator(this.settings.get_strv('incognito-shortcut')[0]);
            });
            this.connect('activated', () => {
                const ctl = new gtk4.EventControllerKey();
                const content = new adw1.StatusPage({
                    title: _('New shortcut'),
                    icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
                });
                const editor = new adw1.Window({
                    modal: true,
                    transient_for: this.get_root(),
                    hide_on_close: true,
                    width_request: 320,
                    height_request: 240,
                    resizable: false,
                    content,
                });
                editor.add_controller(ctl);
                // See https://github.com/tuberry/color-picker/blob/1a278db139f00787e365fce5977d30b535529edb/color-picker%40tuberry/prefs.js
                ctl.connect('key-pressed', (_, keyval, keycode, state) => {
                    let mask = state & gtk4.accelerator_get_default_mod_mask();
                    mask &= ~gdk4.ModifierType.LOCK_MASK;
                    if (!mask && keyval === gdk4.KEY_Escape) {
                        editor.close();
                        return gdk4.EVENT_STOP;
                    }
                    if (!isValidBinding$1(mask, keycode, keyval) || !isValidAccel$1(mask, keyval)) {
                        return gdk4.EVENT_STOP;
                    }
                    this.settings.set_strv('incognito-shortcut', [gtk4.accelerator_name_with_keycode(null, keyval, keycode, mask)]);
                    editor.destroy();
                    return gdk4.EVENT_STOP;
                });
                editor.present();
            });
            this.add_suffix(shortcutLabel);
            this.set_activatable_widget(shortcutLabel);
        }
    };
    IncognitoShortcutRow = __decorate([
        registerGObjectClass
    ], IncognitoShortcutRow);
    const keyvalIsForbidden$1 = (keyval) => {
        return [
            gdk4.KEY_Home,
            gdk4.KEY_Left,
            gdk4.KEY_Up,
            gdk4.KEY_Right,
            gdk4.KEY_Down,
            gdk4.KEY_Page_Up,
            gdk4.KEY_Page_Down,
            gdk4.KEY_End,
            gdk4.KEY_Tab,
            gdk4.KEY_KP_Enter,
            gdk4.KEY_Return,
            gdk4.KEY_Mode_switch,
        ].includes(keyval);
    };
    const isValidAccel$1 = (mask, keyval) => {
        return gtk4.accelerator_valid(keyval, mask) || (keyval === gdk4.KEY_Tab && mask !== 0);
    };
    const isValidBinding$1 = (mask, keycode, keyval) => {
        return !(mask === 0 ||
            (mask === gdk4.ModifierType.SHIFT_MASK &&
                keycode !== 0 &&
                ((keyval >= gdk4.KEY_a && keyval <= gdk4.KEY_z) ||
                    (keyval >= gdk4.KEY_A && keyval <= gdk4.KEY_Z) ||
                    (keyval >= gdk4.KEY_0 && keyval <= gdk4.KEY_9) ||
                    (keyval >= gdk4.KEY_kana_fullstop && keyval <= gdk4.KEY_semivoicedsound) ||
                    (keyval >= gdk4.KEY_Arabic_comma && keyval <= gdk4.KEY_Arabic_sukun) ||
                    (keyval >= gdk4.KEY_Serbian_dje && keyval <= gdk4.KEY_Cyrillic_HARDSIGN) ||
                    (keyval >= gdk4.KEY_Greek_ALPHAaccent && keyval <= gdk4.KEY_Greek_omega) ||
                    (keyval >= gdk4.KEY_hebrew_doublelowline && keyval <= gdk4.KEY_hebrew_taf) ||
                    (keyval >= gdk4.KEY_Thai_kokai && keyval <= gdk4.KEY_Thai_lekkao) ||
                    (keyval >= gdk4.KEY_Hangul_Kiyeog && keyval <= gdk4.KEY_Hangul_J_YeorinHieuh) ||
                    (keyval === gdk4.KEY_space && mask === 0) ||
                    keyvalIsForbidden$1(keyval))));
    };

    let KeepSearchEntryRow = class KeepSearchEntryRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Keep Search Entry'),
                subtitle: _('Keep search entry when Pano hides'),
            });
            this.settings = getCurrentExtensionSettings();
            const keepSearchEntrySwitch = new gtk4.Switch({
                active: this.settings.get_boolean('keep-search-entry'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('keep-search-entry', keepSearchEntrySwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(keepSearchEntrySwitch);
            this.set_activatable_widget(keepSearchEntrySwitch);
        }
    };
    KeepSearchEntryRow = __decorate([
        registerGObjectClass
    ], KeepSearchEntryRow);

    let LinkPreviewsRow = class LinkPreviewsRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Link Previews'),
                subtitle: _('Allow Pano to visit links on your clipboard to generate link previews'),
            });
            this.settings = getCurrentExtensionSettings();
            const linkPreviews = new gtk4.Switch({
                active: this.settings.get_boolean('link-previews'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('link-previews', linkPreviews, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(linkPreviews);
            this.set_activatable_widget(linkPreviews);
        }
    };
    LinkPreviewsRow = __decorate([
        registerGObjectClass
    ], LinkPreviewsRow);

    let OpenLinksInBrowserRow = class OpenLinksInBrowserRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Open Links in Browser'),
                subtitle: _('Allow Pano to open links on your default browser'),
            });
            this.settings = getCurrentExtensionSettings();
            const openLinksInBrowser = new gtk4.Switch({
                active: this.settings.get_boolean('open-links-in-browser'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('open-links-in-browser', openLinksInBrowser, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(openLinksInBrowser);
            this.set_activatable_widget(openLinksInBrowser);
        }
    };
    OpenLinksInBrowserRow = __decorate([
        registerGObjectClass
    ], OpenLinksInBrowserRow);

    let PasteOnSelectRow = class PasteOnSelectRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Paste on Select'),
                subtitle: _('Allow Pano to paste content on select'),
            });
            this.settings = getCurrentExtensionSettings();
            const pasteOnSelectSwitch = new gtk4.Switch({
                active: this.settings.get_boolean('paste-on-select'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('paste-on-select', pasteOnSelectSwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(pasteOnSelectSwitch);
            this.set_activatable_widget(pasteOnSelectSwitch);
        }
    };
    PasteOnSelectRow = __decorate([
        registerGObjectClass
    ], PasteOnSelectRow);

    let PlayAudioOnCopyRow = class PlayAudioOnCopyRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Play an Audio on Copy'),
                subtitle: _('Allow Pano to play an audio when copying new content'),
            });
            this.settings = getCurrentExtensionSettings();
            const playAudioOnCopySwitch = new gtk4.Switch({
                active: this.settings.get_boolean('play-audio-on-copy'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('play-audio-on-copy', playAudioOnCopySwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(playAudioOnCopySwitch);
            this.set_activatable_widget(playAudioOnCopySwitch);
        }
    };
    PlayAudioOnCopyRow = __decorate([
        registerGObjectClass
    ], PlayAudioOnCopyRow);

    let SendNotificationOnCopyRow = class SendNotificationOnCopyRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Send Notification on Copy'),
                subtitle: _('Allow Pano to send notification when copying new content'),
            });
            this.settings = getCurrentExtensionSettings();
            const sendNotificationOnCopySwitch = new gtk4.Switch({
                active: this.settings.get_boolean('send-notification-on-copy'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('send-notification-on-copy', sendNotificationOnCopySwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(sendNotificationOnCopySwitch);
            this.set_activatable_widget(sendNotificationOnCopySwitch);
        }
    };
    SendNotificationOnCopyRow = __decorate([
        registerGObjectClass
    ], SendNotificationOnCopyRow);

    let ShortcutRow = class ShortcutRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Global Shortcut'),
                subtitle: _('Allows you to toggle visibility of the clipboard manager'),
            });
            this.settings = getCurrentExtensionSettings();
            const shortcutLabel = new gtk4.ShortcutLabel({
                disabled_text: _('Select a shortcut'),
                accelerator: this.settings.get_strv('global-shortcut')[0],
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.connect('changed::global-shortcut', () => {
                shortcutLabel.set_accelerator(this.settings.get_strv('global-shortcut')[0]);
            });
            this.connect('activated', () => {
                const ctl = new gtk4.EventControllerKey();
                const content = new adw1.StatusPage({
                    title: _('New shortcut'),
                    icon_name: 'preferences-desktop-keyboard-shortcuts-symbolic',
                });
                const editor = new adw1.Window({
                    modal: true,
                    transient_for: this.get_root(),
                    hide_on_close: true,
                    width_request: 320,
                    height_request: 240,
                    resizable: false,
                    content,
                });
                editor.add_controller(ctl);
                // See https://github.com/tuberry/color-picker/blob/1a278db139f00787e365fce5977d30b535529edb/color-picker%40tuberry/prefs.js
                ctl.connect('key-pressed', (_, keyval, keycode, state) => {
                    let mask = state & gtk4.accelerator_get_default_mod_mask();
                    mask &= ~gdk4.ModifierType.LOCK_MASK;
                    if (!mask && keyval === gdk4.KEY_Escape) {
                        editor.close();
                        return gdk4.EVENT_STOP;
                    }
                    if (!isValidBinding(mask, keycode, keyval) || !isValidAccel(mask, keyval)) {
                        return gdk4.EVENT_STOP;
                    }
                    this.settings.set_strv('global-shortcut', [gtk4.accelerator_name_with_keycode(null, keyval, keycode, mask)]);
                    editor.destroy();
                    return gdk4.EVENT_STOP;
                });
                editor.present();
            });
            this.add_suffix(shortcutLabel);
            this.set_activatable_widget(shortcutLabel);
        }
    };
    ShortcutRow = __decorate([
        registerGObjectClass
    ], ShortcutRow);
    const keyvalIsForbidden = (keyval) => {
        return [
            gdk4.KEY_Home,
            gdk4.KEY_Left,
            gdk4.KEY_Up,
            gdk4.KEY_Right,
            gdk4.KEY_Down,
            gdk4.KEY_Page_Up,
            gdk4.KEY_Page_Down,
            gdk4.KEY_End,
            gdk4.KEY_Tab,
            gdk4.KEY_KP_Enter,
            gdk4.KEY_Return,
            gdk4.KEY_Mode_switch,
        ].includes(keyval);
    };
    const isValidAccel = (mask, keyval) => {
        return gtk4.accelerator_valid(keyval, mask) || (keyval === gdk4.KEY_Tab && mask !== 0);
    };
    const isValidBinding = (mask, keycode, keyval) => {
        return !(mask === 0 ||
            (mask === gdk4.ModifierType.SHIFT_MASK &&
                keycode !== 0 &&
                ((keyval >= gdk4.KEY_a && keyval <= gdk4.KEY_z) ||
                    (keyval >= gdk4.KEY_A && keyval <= gdk4.KEY_Z) ||
                    (keyval >= gdk4.KEY_0 && keyval <= gdk4.KEY_9) ||
                    (keyval >= gdk4.KEY_kana_fullstop && keyval <= gdk4.KEY_semivoicedsound) ||
                    (keyval >= gdk4.KEY_Arabic_comma && keyval <= gdk4.KEY_Arabic_sukun) ||
                    (keyval >= gdk4.KEY_Serbian_dje && keyval <= gdk4.KEY_Cyrillic_HARDSIGN) ||
                    (keyval >= gdk4.KEY_Greek_ALPHAaccent && keyval <= gdk4.KEY_Greek_omega) ||
                    (keyval >= gdk4.KEY_hebrew_doublelowline && keyval <= gdk4.KEY_hebrew_taf) ||
                    (keyval >= gdk4.KEY_Thai_kokai && keyval <= gdk4.KEY_Thai_lekkao) ||
                    (keyval >= gdk4.KEY_Hangul_Kiyeog && keyval <= gdk4.KEY_Hangul_J_YeorinHieuh) ||
                    (keyval === gdk4.KEY_space && mask === 0) ||
                    keyvalIsForbidden(keyval))));
    };

    let ShowIndicatorRow = class ShowIndicatorRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Show Indicator'),
                subtitle: _('Shows an indicator on top panel'),
            });
            this.settings = getCurrentExtensionSettings();
            const showIndicatorSwitch = new gtk4.Switch({
                active: this.settings.get_boolean('show-indicator'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('show-indicator', showIndicatorSwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(showIndicatorSwitch);
            this.set_activatable_widget(showIndicatorSwitch);
        }
    };
    ShowIndicatorRow = __decorate([
        registerGObjectClass
    ], ShowIndicatorRow);

    let SyncPrimaryRow = class SyncPrimaryRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Sync Primary'),
                subtitle: _('Sync primary selection with clipboard selection'),
            });
            this.settings = getCurrentExtensionSettings();
            const pasteOnSelectSwitch = new gtk4.Switch({
                active: this.settings.get_boolean('sync-primary'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('sync-primary', pasteOnSelectSwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(pasteOnSelectSwitch);
            this.set_activatable_widget(pasteOnSelectSwitch);
        }
    };
    SyncPrimaryRow = __decorate([
        registerGObjectClass
    ], SyncPrimaryRow);

    let WatchExclusionsRow = class WatchExclusionsRow extends adw1.ActionRow {
        constructor() {
            super({
                title: _('Watch Exclusions'),
                subtitle: _('When enabled, Pano will not track clipboard from excluded apps'),
            });
            this.settings = getCurrentExtensionSettings();
            const watchExclusionsSwitch = new gtk4.Switch({
                active: this.settings.get_boolean('watch-exclusion-list'),
                valign: gtk4.Align.CENTER,
                halign: gtk4.Align.CENTER,
            });
            this.settings.bind('watch-exclusion-list', watchExclusionsSwitch, 'active', gio2.SettingsBindFlags.DEFAULT);
            this.add_suffix(watchExclusionsSwitch);
            this.set_activatable_widget(watchExclusionsSwitch);
        }
    };
    WatchExclusionsRow = __decorate([
        registerGObjectClass
    ], WatchExclusionsRow);

    let GeneralGroup = class GeneralGroup extends adw1.PreferencesGroup {
        constructor() {
            super({
                title: _('General Options'),
            });
            this.add(new DBLocationRow());
            this.add(new HistoryLengthRow());
            this.add(new ShortcutRow());
            this.add(new IncognitoShortcutRow());
            this.add(new SyncPrimaryRow());
            this.add(new PasteOnSelectRow());
            this.add(new SendNotificationOnCopyRow());
            this.add(new PlayAudioOnCopyRow());
            this.add(new KeepSearchEntryRow());
            this.add(new ShowIndicatorRow());
            this.add(new LinkPreviewsRow());
            this.add(new OpenLinksInBrowserRow());
            this.add(new WatchExclusionsRow());
        }
    };
    GeneralGroup = __decorate([
        registerGObjectClass
    ], GeneralGroup);

    let GeneralPage = class GeneralPage extends adw1.PreferencesPage {
        constructor() {
            super({
                title: _('General'),
                icon_name: 'preferences-system-symbolic',
            });
            this.add(new GeneralGroup());
            this.add(new ExclusionGroup());
        }
    };
    GeneralPage = __decorate([
        registerGObjectClass
    ], GeneralPage);

    const debug = logger('prefs');
    const init = () => {
        debug('prefs initialized');
        initTranslations();
    };
    const fillPreferencesWindow = (window) => {
        window.add(new GeneralPage());
        window.add(new CustomizationPage());
        window.add(new DangerZonePage());
        window.search_enabled = true;
        const display = gdk4.Display.get_default();
        if (display) {
            gtk4.IconTheme.get_for_display(display).add_search_path(`${getCurrentExtension().path}/icons/`);
        }
    };
    var prefs = { init, fillPreferencesWindow };

    return prefs;

})(imports.gi.Gdk, imports.gi.Gtk, imports.gi.Adw, imports.gi.Gio, imports.gi.Pango, imports.gi.GObject, imports.gi.GLib);
var init = prefs.init;
var fillPreferencesWindow = prefs.fillPreferencesWindow;
