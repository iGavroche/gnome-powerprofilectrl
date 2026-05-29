UUID = powerprofilectrl@iGavroche
INSTALL_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
PREFIX ?= /usr
SYSTEM_DIR = $(PREFIX)/share/gnome-shell/extensions/$(UUID)

all: schemas

schemas:
	glib-compile-schemas schemas/

install: schemas
	mkdir -p $(INSTALL_DIR)
	cp extension.js metadata.json stylesheet.css LICENSE $(INSTALL_DIR)/
	cp -r schemas $(INSTALL_DIR)/
	@echo "Installed to $(INSTALL_DIR)"
	@echo "Restart GNOME Shell (Alt+F2, r, Enter) then enable with:"
	@echo "  gnome-extensions enable $(UUID)"

install-system: schemas
	sudo mkdir -p $(SYSTEM_DIR)
	sudo cp extension.js metadata.json stylesheet.css LICENSE $(SYSTEM_DIR)/
	sudo cp -r schemas $(SYSTEM_DIR)/
	@echo "Installed to $(SYSTEM_DIR)"
	@echo "Restart GNOME Shell (Alt+F2, r, Enter) then enable with:"
	@echo "  gnome-extensions enable $(UUID)"

uninstall:
	rm -rf $(INSTALL_DIR)

uninstall-system:
	sudo rm -rf $(SYSTEM_DIR)

.PHONY: all schemas install install-system uninstall uninstall-system
