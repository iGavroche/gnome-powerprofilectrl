# Power Profile Controller

A GNOME Shell extension that adds a power profile indicator to the Quick Settings menu (top-right panel). Lets you switch between **Performance**, **Balanced**, and **Power Saver** modes with a single click.

![screenshot](https://img.shields.io/badge/GNOME-45–50-blue)

## Features

- **Panel indicator** — shows the current profile icon in the top bar's Quick Settings area
- **Quick Settings toggle** — click to open a menu and switch profiles
- **Scroll wheel** — scroll on the icon to cycle through profiles
- **Live updates** — icon and menu reflect changes made by other tools (`powerprofilesctl`)
- **Degraded/Inhibited warnings** — subtitle shows when performance is degraded or inhibited

## Requirements

- GNOME Shell **45**, **46**, **47**, **48**, **49**, or **50**
- `power-profiles-daemon` (installed by default on most distros)

## Installation

### From source

```bash
# Clone the repository
git clone https://github.com/iGavroche/gnome-powerprofilectrl.git
cd gnome-powerprofilectrl

# Install system-wide (all users) or locally
make install         # installs to ~/.local/share/gnome-shell/extensions/
# sudo make install  # installs to /usr/share/gnome-shell/extensions/

# Compile the GSettings schema (required)
make schemas

# Restart GNOME Shell
# Alt+F2, type 'r', press Enter

# Enable the extension
gnome-extensions enable powerprofilectrl@iGavroche
```

### Manual

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/powerprofilectrl@iGavroche
cp -r * ~/.local/share/gnome-shell/extensions/powerprofilectrl@iGavroche/

# Compile schema
glib-compile-schemas ~/.local/share/gnome-shell/extensions/powerprofilectrl@iGavroche/schemas/

# Restart shell
# Alt+F2, type 'r', Enter

# Enable
gnome-extensions enable powerprofilectrl@iGavroche
```

### From source (no make)

```bash
INSTALL_DIR="$HOME/.local/share/gnome-shell/extensions/powerprofilectrl@iGavroche"
mkdir -p "$INSTALL_DIR"
cp extension.js metadata.json stylesheet.css LICENSE "$INSTALL_DIR/"
cp -r schemas "$INSTALL_DIR/"
glib-compile-schemas "$INSTALL_DIR/schemas/"
gnome-extensions enable powerprofilectrl@iGavroche
# Restart shell: Alt+F2, r, Enter
```

## Usage

| Action | Result |
|--------|--------|
| Click the power icon | Opens the Quick Settings menu with profile options |
| Select a profile | Switches immediately |
| Scroll up/down on icon | Cycles power-saver ↔ balanced ↔ performance |
| `powerprofilesctl` CLI | Changes are reflected live in the panel |

## Development

```bash
# After editing extension.js, restart shell to reload:
# Alt+F2, r, Enter

# Or use Looking Glass for debugging:
# Alt+F2, type 'lg', Enter
# In the console: log('debug message')
```

## License

MIT
