/*
 * rmt.css - Sunela remote consrol protocol (experimental)
 *
 * This work is licensed under the terms of the MIT License.
 * A copy of the license can be found in the file LICENSE.MIT
 */

// Useful references:
//
// WebUSB:
// https://developer.mozilla.org/en-US/docs/Web/API/USB/requestDevice
//
// Typed Arrays (transfer buffers):
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/toString
//
// Polling with delay:
// https://stackoverflow.com/questions/46208031/polling-until-getting-specific-result


const SUNELA_USB_VENDOR = 0x20b7;	/* Qi Hardware */
const SUNELA_USB_PRODUCT = 0xae72;	/* Sunela (AnELok, device 2) */

const SUNELA_RMT = 4;

const RDOP_LS = 2;
const RDOP_SHOW = 4;

const SUNELA_MAX_RESPONSE = 256;


var ggg = null;

class Sunela {

	// --- Send a request -------------------------------------------------


	async send(data)
	{
		console.log("sending", data);
		while (1) {
			var res;

			await this.wait(10);
			res = await this.device.controlTransferOut({
				requestType:	"vendor",
				recipient:	"device",
				request:	SUNELA_RMT,
				index:		0,
				value:		0,
			}, data);
			if (res.status != "stall")
				break;
		}
	}


	async begin_request(op, arg)
	{
		var data;

		if (arg) {
			data = new Uint8Array(arg.length + 1);
			data.set(new Uint8Array([ op ]));
			data.set(new TextEncoder("utf-8").encode(arg), 1);
		} else {
			data = new Uint8Array([ op ]);
		}
		await this.send(data);
	}


	async end_request()
	{
		await this.send(new Uint8Array(0));
	}


	// --- Receive a response ---------------------------------------------


	wait(ms)
	{
		return new Promise(resolve => { setTimeout(resolve, ms); });
	}


	async receive()
	{
		var res;

		while (1) {
			await this.wait(10);
			res = await this.device.controlTransferIn({
				requestType:	"vendor",
				recipient:	"device",
				request:	SUNELA_RMT,
				index:		0,
				value:		0,
			}, SUNELA_MAX_RESPONSE);
			if (res.status != "stall")
				break;
		}
		if (res.status == "ok") {
			return res.data.buffer;
		}
		console.log("controlTransferIn status:", res.status);
		return null;
	}


	async response()
	{
		var res = [];

		while (1) {
			var got = await this.receive();

			if (!got.byteLength)
				return res;
			res.push(got)
		}
	}


	// --- Operations -----------------------------------------------------


	async ls()
	{
		var decoder = new TextDecoder();
		var res;

		await this.begin_request(RDOP_LS, null);
		await this.end_request();
		res = await this.response();
		return res.map((x) => decoder.decode(x));
	}


	async show(name)
	{
		var res;

		await this.begin_request(RDOP_SHOW, name);
		await this.end_request();
		res = await this.response();
		return res.map((x) => new Uint8Array(x));
	}


	// --- Initialization -------------------------------------------------


	async request_usb()
	{
		this.device = await navigator.usb
		    .requestDevice({ filters: [{
			vendorId: SUNELA_USB_VENDOR,
			productId: SUNELA_USB_PRODUCT }]});

		await this.device.open();
		await this.device.selectConfiguration(1);
//		await this.device.claimInterface(0);
	}


	constructor()
	{
		this.device = null;
	}
}
