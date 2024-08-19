// 
// https://developer.mozilla.org/en-US/docs/Web/API/USB/requestDevice

const SUNELA_USB_VENDOR = 0x20b7;	/* Qi Hardware */
const SUNELA_USB_PRODUCT = 0xae72;	/* Sunela (AnELok, device 2) */

const SUNELA_RMT = 4;

const RDOP_LS = 2;

const SUNELA_MAX_RESPONSE = 256;


function sunela_send(device, data)
{
console.log("sending", data);
	return device.controlTransferOut({
		requestType:	"vendor",
		recipient:	"device",
		request:	SUNELA_RMT,
		index:		0,
		value:		0,
	}, data);
}


function sunela_begin_request(device, op, arg)
{
	var data =  new Uint8Array([ op ]);

	if (arg)
		data += new TextEncoder("utf-8").encode(arg);
	return sunela_send(device, data);
}


function sunela_end_request(device)
{
	return sunela_send(device, new Uint8Array(0));
}


// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/slice
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray/toString


// https://stackoverflow.com/questions/46208031/polling-until-getting-specific-result

function wait(ms)
{
	return new Promise(resolve => { setTimeout(resolve, ms); });
}


async function sunela_receive(device)
{
	var res;

	while (1) {
		res = await device.controlTransferIn({
			requestType:	"vendor",
			recipient:	"device",
			request:	SUNELA_RMT,
			index:		0,
			value:		0,
		}, SUNELA_MAX_RESPONSE);
		if (res.status != "stall")
			break;
		await wait(100);
	}
	if (res.status == "ok") {
		var decoder = new TextDecoder();
		return decoder.decode(res.data);
	}
	console.log("controlTransferIn status:", res.status);
	return null;
}


async function request_usb()
{
	let device;

	device = await navigator.usb
	    .requestDevice({ filters: [{
		vendorId: SUNELA_USB_VENDOR,
		productId: SUNELA_USB_PRODUCT }]});

	await device.open();
	await device.selectConfiguration(1);
//	await device.claimInterface(0);

	sunela_begin_request(device, RDOP_LS, null);
	sunela_end_request(device);

	while (1) {
		got = await sunela_receive(device);
		if (got == "")
			break;
		console.log(got);
	}
}
