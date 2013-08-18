var WACOM_PKGLEN_BBFUN = 9;

function wacomGetReport(wacom, type, id, size, callback, errback, tries)
{
    if(tries == 0)
        errback();

    var transferInfo = {
        direction: "in",
        recipient: "interface",
        requestType: "class",
        request: 1,
        value: (type << 8) + id,
        index: wacom.descriptors[0].interfaceNumber,
        length: size
    };

    console.log(wacom);
    console.log(transferInfo);

    chrome.usb.controlTransfer(wacom.device, transferInfo, function(info) {
        if (info.resultCode == 0)
            callback(info.data);
        else
            wacomGetReport(wacom, type, id, callback, tries - 1);
    });
}

function wacomSetReport(wacom, type, id, data, callback, errback, tries)
{
    if(tries == 0)
        errback();

    var transferInfo = {
        direction: "out",
        recipient: "interface",
        requestType: "class",
        request: 9,
        value: (type << 8) + id,
        index: wacom.descriptors[0].interfaceNumber,
        data: data,
    };

    console.log(wacom);
    console.log(transferInfo);

    chrome.usb.controlTransfer(wacom.device, transferInfo, function(info) {
        if (info.resultCode == 0)
            callback(info.data);
        else
            wacomSetReport(wacom, type, id, data, callback, tries - 1);
    });
}

function wacomSetDeviceMode(wacom, report_id, length, mode, callback)
{
    var rep_data, rep_view;

    rep_data = new ArrayBuffer(length);
    rep_view = new Uint8Array(rep_data);
    var tries = 5;
    var retry = function() {
        if(tries-- == 0)
            return;

        rep_view[0] = report_id;
        rep_view[1] = mode;

        wacomSetReport(wacom, 3, report_id, rep_data, function(data) {
            wacomGetReport(wacom, 3, report_id, length, function(data) {
                callback();
            }, retry, 1);
        }, retry, 1);
    }
    retry();
}

function createWacomObject(device, callback)
{
    var wacom = { device: device };
    chrome.usb.listInterfaces(device, function(descriptors) {
        wacom.descriptors = descriptors;
        callback(wacom);
    });
}

function wacomGetData(wacom, callback)
{
    var transferInfo = {
        direction: "in",
        endpoint: wacom.descriptors[0].endpoints[0].address,
        length: WACOM_PKGLEN_BBFUN
    }
    chrome.usb.interruptTransfer(wacom.device, transferInfo, function(info) {
        callback(info.data);
    })
}

function wacomMain(wacom)
{
    var stylus_in_proximity = false;
    var poll = (function(data) {
        var data8 = new Uint8Array(data);
        var data16 = new Uint16Array(data, 0, 4);
        var prox = 0, x = 0, y = 0, p = 0, d = 0, pen = 0, btn1 = 0, btn2 = 0;
        if (data8[0] != 0x02)
            return;
        prox = (data8[1] & 0x90) == 0x90;
        if (prox) {
            if (!stylus_in_proximity) {
                if (data8[1] & 0x20) {
                    console.log("Eraser");
                } else {
                    console.log("Pen");
                }
                stylus_in_proximity = true;
            }
            x = data16[1];
            y = data16[2];
            p = data16[3];
            if (data[8] <= 63)
                d = 63 - data8[8];
            pen = data8[1] & 0x01;
            btn1 = data8[1] & 0x02;
            btn2 = data8[1] & 0x04;
            console.log("x: " + x + ", y: " + y + ", p: " + p + ", d: " + d + ", pen: " + pen + ", btn1: " + btn1 + ", btn2:" + btn2);
        } else {
            console.log("Out of range: " + data8[1]);
            stylus_in_proximity = false;
        }
        
        wacomGetData(wacom, poll);
    });
    wacomGetData(wacom, poll);
}

function wacomProbe(device)
{
    console.log("Probing device.");
    createWacomObject(device, function(wacom) {
        //chrome.usb.claimInterface(device, 0, function() {
            console.log("Setting device mode.");
            wacomSetDeviceMode(wacom, 2, 2, 2, function() {
                console.log("Starting main loop.");
                wacomMain(wacom);
            })
        //});
    });
}

function wacomProbeArray(devices)
{
    for (var i in devices) {
        wacomProbe(devices[i]);
    }
}

chrome.usb.findDevices({vendorId: 1386, productId: 23}, wacomProbeArray);
