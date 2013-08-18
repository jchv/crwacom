# Welcome
This source code attempts to enable WACOM graphics tablets to connect to
Chromium devices. It is also possible to use it on other OSes supported by
Chromium (except Mac OS X, which will not allow Chrome to capture the tablet
device, since it is an HID device.)

The driver is *not* ready for end users in it's current state. It simply dumps
the digitizer input onto the console, not allowing any form of control of the
Chromium instance. Further, it is hardcoded to work with the tablet that I have.
This will change in the future (hopefully.)

Furthermore, it relies on a recent change in Chromium 29 that allows for
permissions to USB devices to be specified and not requested per-device.
Stable users running Chromium 28 will hit an error trying to load this 
extension. Although the fix would be rather trivial, I am not currently
interested in fixing it (partially because it requires a user-visible UI.)
