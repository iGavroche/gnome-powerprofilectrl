'use strict';

import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

const QuickSettingsMenu = Main.panel.statusArea.quickSettings;

const POWER_PROFILES_DBUS_NAME = 'net.hadess.PowerProfiles';
const POWER_PROFILES_DBUS_PATH = '/net/hadess/PowerProfiles';

const PowerProfilesIface = `<node>
  <interface name="net.hadess.PowerProfiles">
    <property name="ActiveProfile" type="s" access="readwrite"/>
    <property name="Profiles" type="aa{sv}" access="read"/>
    <property name="PerformanceDegraded" type="s" access="read"/>
    <property name="PerformanceInhibited" type="s" access="read"/>
  </interface>
</node>`;

const PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(PowerProfilesIface);

const PROFILE_ICON = {
    'power-saver': 'power-profile-power-saver-symbolic',
    'balanced': 'power-profile-balanced-symbolic',
    'performance': 'power-profile-performance-symbolic',
};

const PROFILE_LABEL = {
    'power-saver': _('Power Saver'),
    'balanced': _('Balanced'),
    'performance': _('Performance'),
};

const FALLBACK_ICON = 'power-profile-balanced-symbolic';

const PowerProfileToggle = GObject.registerClass({
    Signals: {'profile-set': {param_types: [GObject.TYPE_STRING]}},
}, class PowerProfileToggle extends QuickSettings.QuickMenuToggle {
    _init(extension) {
        super._init({
            title: _('Power Profile'),
            toggleMode: false,
        });

        this._proxy = extension._proxy;
        this._settings = extension._settings;

        this._currentIcon = Gio.ThemedIcon.new(FALLBACK_ICON);
        this.menu.setHeader(this._currentIcon, _('Power Profile'), '');

        this._itemsSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._itemsSection);
        this._profileItems = {};

        this._syncProfiles();
        this._updateState();

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const settingsItem = this.menu.addAction(_('Settings'), () => extension._openPreferences());
        settingsItem.visible = Main.sessionMode.allowSettings;
        this.menu._settingsActions[extension.uuid] = settingsItem;
    }

    _syncProfiles() {
        this._itemsSection.removeAll();
        this._profileItems = {};

        let profiles = [];
        try {
            const raw = this._proxy.Profiles;
            if (Array.isArray(raw)) {
                for (const entry of raw) {
                    if (entry && entry.Profile)
                        profiles.push(entry.Profile);
                }
            }
        } catch (e) {
            log(`[PowerProfileCtrl] Failed to read profiles: ${e}`);
        }

        if (profiles.length === 0)
            profiles = Object.keys(PROFILE_LABEL);

        for (const profile of profiles) {
            const icon = Gio.ThemedIcon.new(PROFILE_ICON[profile] || FALLBACK_ICON);
            const label = PROFILE_LABEL[profile] || profile;
            const item = new PopupMenu.PopupImageMenuItem(label, icon);
            item.profileId = profile;
            item.connectObject('activate', () => {
                this._proxy.ActiveProfile = profile;
                this.emit('profile-set', profile);
            }, this);
            this._profileItems[profile] = item;
            this._itemsSection.addMenuItem(item);
        }

        this._syncOrnaments();
    }

    _syncOrnaments() {
        let active;
        try {
            active = this._proxy.ActiveProfile;
        } catch (e) {
            active = 'balanced';
        }

        for (const [profile, item] of Object.entries(this._profileItems)) {
            item.setOrnament(
                profile === active ? PopupMenu.Ornament.DOT : PopupMenu.Ornament.NONE
            );
        }
    }

    _updateState() {
        let active;
        let degraded;
        let inhibited;
        try {
            active = this._proxy.ActiveProfile;
            degraded = this._proxy.PerformanceDegraded;
            inhibited = this._proxy.PerformanceInhibited;
        } catch (e) {
            active = 'balanced';
            degraded = '';
            inhibited = '';
        }

        this._syncOrnaments();

        const iconName = PROFILE_ICON[active] || FALLBACK_ICON;
        this._currentIcon = Gio.ThemedIcon.new(iconName);
        this.menu.setHeader(this._currentIcon, _('Power Profile'), PROFILE_LABEL[active] || active);
        this.gicon = this._currentIcon;

        if (degraded)
            this.subtitle = _('Degraded: ') + degraded;
        else if (inhibited)
            this.subtitle = _('Inhibited: ') + inhibited;
        else
            this.subtitle = null;
    }

    update() {
        this._updateState();
    }
});

const PowerProfileIndicator = GObject.registerClass(
class PowerProfileIndicator extends QuickSettings.SystemIndicator {
    _init(extension) {
        super._init();

        this._proxy = extension._proxy;

        this._indicator = this._addIndicator();
        this._indicator.gicon = Gio.ThemedIcon.new(FALLBACK_ICON);
        this._indicator.reactive = true;

        this._indicator.connectObject('scroll-event',
            (actor, event) => this._handleScrollEvent(event), this);

        this._toggle = new PowerProfileToggle(extension);
        this.quickSettingsItems.push(this._toggle);

        QuickSettingsMenu.addExternalIndicator(this);
    }

    _handleScrollEvent(event) {
        let direction = event.get_scroll_direction();
        if (event.get_scroll_flags() & Clutter.ScrollFlags.INVERTED) {
            if (direction === Clutter.ScrollDirection.UP)
                direction = Clutter.ScrollDirection.DOWN;
            else if (direction === Clutter.ScrollDirection.DOWN)
                direction = Clutter.ScrollDirection.UP;
        }

        let active;
        try {
            active = this._proxy.ActiveProfile;
        } catch (e) {
            active = 'balanced';
        }

        const profiles = Object.keys(PROFILE_ICON);
        let idx = profiles.indexOf(active);
        if (idx < 0)
            idx = 1;

        switch (direction) {
        case Clutter.ScrollDirection.UP:
            idx = (idx + 1) % profiles.length;
            break;
        case Clutter.ScrollDirection.DOWN:
            idx = (idx - 1 + profiles.length) % profiles.length;
            break;
        default:
            return;
        }

        try {
            this._proxy.ActiveProfile = profiles[idx];
        } catch (e) {
            log(`[PowerProfileCtrl] Failed to set profile: ${e}`);
        }
    }

    update() {
        let active;
        try {
            active = this._proxy.ActiveProfile;
        } catch (e) {
            active = 'balanced';
        }

        const iconName = PROFILE_ICON[active] || FALLBACK_ICON;
        this._indicator.gicon = Gio.ThemedIcon.new(iconName);
        this._toggle.update();
    }

    destroy() {
        this.quickSettingsItems.forEach(item => item.destroy());
        super.destroy();
    }
});

export default class PowerProfileExtension extends Extension {
    enable() {
        this._settings = this.getSettings();

        this._proxy = new PowerProfilesProxy(
            Gio.DBus.session,
            POWER_PROFILES_DBUS_NAME,
            POWER_PROFILES_DBUS_PATH,
            (proxy, error) => {
                if (error) {
                    log(`[PowerProfileCtrl] D-Bus error: ${error.message}`);
                    return;
                }
                this._onReady();
            }
        );

        // g-name-owner changes (service appears/disappears)
        this._proxy.connectObject('notify::g-name-owner', () => {
            if (this._proxy.g_name_owner && this._indicator)
                this._indicator.update();
        }, this);
    }

    _onReady() {
        this._indicator = new PowerProfileIndicator(this);
        this._indicator.update();

        this._proxy.connectObject('g-properties-changed', () => {
            if (this._indicator)
                this._indicator.update();
        }, this);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
        if (this._proxy) {
            this._proxy.disconnectObject(this);
            this._proxy = null;
        }
        this._settings = null;
    }

    _openPreferences() {
        this.openPreferences();
        QuickSettingsMenu.menu.close();
    }
}
