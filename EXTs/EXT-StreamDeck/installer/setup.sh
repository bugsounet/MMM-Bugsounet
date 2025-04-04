#!/bin/bash
# +-----------------+
# | npm setup |
# +-----------------+

source ../../installer/utils.sh

# copy rules
Installer_info "Installing StreamDeck rules..."
sudo cp 50-elgato.rules /etc/udev/rules.d/50-elgato.rules
sudo udevadm control --reload-rules

Installer_success "Setup Complete !"
echo
Installer_warning "Reboot your device to activate StreamDeck rules!"
# Go back to module root
cd ..
