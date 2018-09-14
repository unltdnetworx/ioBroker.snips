![Logo](admin/snips.png)
# ioBroker.snips
=================

Snips Offline Speak2Text Adapter for ioBroker

Snips Url: https://makers.snips.ai/

Benötigt wird auch das Modul "Text2Command" für das Ausführen von Befehlen.

**********************Installation Snips***************************

Für Snips unter Debian Stretch(x86),Raspbian/Armbian Stretch(RPI3,Odroid) bitte folgende Pakete installieren:

lsb-release 
apt-transport-https 
ca-certificates 
systemd 
systemd-sysv 
libttspico-utils 
alsa-utils
dirmngr
mosquitto
snips-asr
snips-audio-server
snips-dialogue
snips-hotword
snips-nlu
snips-tts
snips-asr-injection

Es können je nach verwendete Hardware und Linux-Distributionen schon Pakete vorhanden sein.

Installationsanleitung und Konfiguration für Raspian/Armbian:
https://snips.gitbook.io/documentation/installing-snips/on-a-raspberry-pi

Installationsanleitung und Konfiguration für Debian:
sudo nano /etc/apt/sources.list
In jeder Zeile "non-free" anhängen, sonst kann man das Paket "libttspico-utils" nicht installieren.
https://snips.gitbook.io/documentation/advanced-configuration/advanced-solutions

Jetzt bei "https://console.snips.ai" anmelden und einen neuen Assistenten hinzufügen.
Eine App hinzufügen, oben den Haken "only show apps with actions" entfernen und nach FHEM suchen und anwählen.
Wenn ihr fertig seid, drückt ihr auf auf Deploy Assistant um das ZIP File herunterzuladen.
Das Zipfile wird auf dem Snips-Rechner unter "/usr/share/snips" entpackt, danach neu booten.

Snips sollte erst funktionieren, bevor es hier weiter geht:

*************************Snips-Adapter konfigurieren***************************
Url      : Adresse des Snips-MQTT-Servers
Port     : Port des Snips-MQTT-Servers
Topic    : Text Topic vom Text2Command-Adapters z.B text2command.0.text
ClientID : eindeutige ID z.B. 0

*********************Text2Command-Adapter konfigurieren************************
In der Config vom Text2Command-Adapters unter Antwort in ID snips.0.send.say.text einfügen.

************************Injection(neue Wörter lernen)**************************
Unbekannte Wörter können unter snips.0.send.inject.room oder device angelernt werden


### 0.0.2
* (wal) first working adapter

### 0.0.1
* (wal) initial release

## License
The MIT License (MIT)

Copyright (c) 2018 Walter Zengel <w.zengel@gmx.de>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
