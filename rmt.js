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

const SUNELA_MAX_RESPONSE = 256;


class Sunela {

	// --- Send a request -------------------------------------------------


	send(data)
	{
		console.log("sending", data);
		return this.device.controlTransferOut({
			requestType:	"vendor",
			recipient:	"device",
			request:	SUNELA_RMT,
			index:		0,
			value:		0,
		}, data);
	}


	begin_request(op, arg)
	{
		var data =  new Uint8Array([ op ]);

		if (arg)
			data += new TextEncoder("utf-8").encode(arg);
		return this.send(data);
	}


	end_request()
	{
		return this.send(new Uint8Array(0));
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
			res = await this.device.controlTransferIn({
				requestType:	"vendor",
				recipient:	"device",
				request:	SUNELA_RMT,
				index:		0,
				value:		0,
			}, SUNELA_MAX_RESPONSE);
			if (res.status != "stall")
				break;
			await this.wait(100);
		}
		if (res.status == "ok") {
			var decoder = new TextDecoder();
			return decoder.decode(res.data);
		}
		console.log("controlTransferIn status:", res.status);
		return null;
	}


	async response()
	{
		var res = [];

		while (1) {
			var got = await this.receive();

			if (got == "")
				return res;
			res.push(got)
		}
	}


	// --- Operations -----------------------------------------------------


	async ls()
	{
		await this.begin_request(RDOP_LS, null);
		await this.end_request();
		return await this.response();
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
