/*
 * main.js - Sunela Web UI
 *
 * This work is licensed under the terms of the MIT License.
 * A copy of the license can be found in the file LICENSE.MIT
 */


const MAX_T_DIFF_S = 2;

const SUNELA_FIELD_ID		= 1;
const SUNELA_FIELD_PREV		= 2;
const SUNELA_FIELD_USER		= 3;
const SUNELA_FIELD_EMAIL	= 4;
const SUNELA_FIELD_PW		= 5;
const SUNELA_FIELD_HOTP_SECRET	= 6;
const SUNELA_FIELD_HOTP_COUNTER	= 7;
const SUNELA_FIELD_TOTP_SECRET	= 8;
const SUNELA_FIELD_COMMENT	= 9;
const SUNELA_FIELD_PW2		= 10;


/* --- Useful functions ---------------------------------------------------- */


function is_string(x)
{
	// https://stackoverflow.com/a/9436948/11496135
	return typeof x == "string" || x instanceof String;
}


function class_toggle(e, name, on)
{
	var re = new RegExp("\\s+\\b" + name + "\\b|\\b" + name + "\\b\\s*");

	if (is_string(e))
		e = document.getElementById(e);
	e.className = e.className.replace(re, "");
	if (on) {
		e.className += " " + name;
	}
}


function remove_all_children(e)
{
	if (is_string(e))
		e = document.getElementById(e);
	// https://stackoverflow.com/a/3955238 (2A)
	while (e.firstChild) {
		e.removeChild(e.lastChild);
	}
}


/* Only leave the first child */
function remove_extra_children(e)
{
	if (is_string(e))
		e = document.getElementById(e);
	while (e.firstChild != e.lastChild) {
		e.removeChild(e.lastChild);
	}
}


/* --- Open an account entry ----------------------------------------------- */


/*
 * Note: we also decode fields the UI should normally not see, just in case.
 */
function field_name(code)
{
	if (code == SUNELA_FIELD_ID)
		return "ID";
	if (code == SUNELA_FIELD_PREV)
		return "Prev";
	if (code == SUNELA_FIELD_USER)
		return "User";
	if (code == SUNELA_FIELD_EMAIL)
		return "E-Mail";
	if (code == SUNELA_FIELD_PW)
		return "Password";
	if (code == SUNELA_FIELD_HOTP_SECRET)
		return "HOTP Secret";
	if (code == SUNELA_FIELD_HOTP_COUNTER)
		return "HOTP Counter";
	if (code == SUNELA_FIELD_TOTP_SECRET)
		return "TOTP Secret";
	if (code == SUNELA_FIELD_COMMENT)
		return "Comment";
	if (code == SUNELA_FIELD_PW2)
		return "Password2";
	return code.toString();
}


function le_uint(a)
{
	var shift = 0;
	var sum = 0;

	for (var i = 0; i != a.length; i++) {
		sum += a[i] << shift;
		shift += 8;
	}
	return sum;
}


function field_convert(code, data)
{
	const hidden = [
		SUNELA_FIELD_PW,
		SUNELA_FIELD_HOTP_SECRET,
		SUNELA_FIELD_TOTP_SECRET,
		SUNELA_FIELD_PW2
	];

	if (code == SUNELA_FIELD_HOTP_COUNTER)
		return le_uint(data).toString();
	if (hidden.includes(code))
		return "---";

	var decoder = new TextDecoder();

	return decoder.decode(data);
}


async function open_entry(span, name)
{
	var fields;

	try {
		fields = await sunela.show(name);
	} catch (error) {
		console.error(error);
		return;
	}

	for (var e of es) {
		remove_extra_children(e);
	}
	for (var f of fields) {
		let div = document.createElement("DIV");

		div.className = "field";
		span.appendChild(div);

		var s = document.createElement("SPAN");
		var code = f[0];

		s.textContent = field_name(code);
		div.appendChild(s);
	
		s = document.createElement("SPAN");
		s.textContent = field_convert(code, f.slice(1));
		div.appendChild(s);
	}
}


/* --- Update the time ----------------------------------------------------- */


function update_time(dt)
{
	var box = document.getElementById("set-time");
	var delta = document.getElementById("dt");
	var dismiss = document.getElementById("dt-dismiss");
	var update = document.getElementById("dt-update");
	var n = Math.abs(dt);
	var s;

	if (n >= 100 * 7 * 24 * 3600) {
		s = Math.floor(n / 3600 / 24 / 365.25).toString() + " years";
	} else if (n > 3 * 7 * 24 * 3600) {
		s = Math.floor(n / 3600 / 24 / 7).toString() + " weeks";
	} else if (n > 4 * 24 * 3600) {
		s = Math.floor(n / 3600 / 24).toString() + " days";
	} else if (n > 4 * 3600) {
		s = Math.floor(n / 3600).toString() + " hours";
	} else if (n > 4 * 60) {
		s = Math.floor(n / 3600).toString() + " minutes";
	} else {
		s = Math.floor(n).toString() + " seconds";
	}
	s += dt < 0 ? " behind" : " ahead";
	delta.textContent = s;

	class_toggle(box, "hidden", false);
	dismiss.addEventListener("click",
	    () => class_toggle(box, "hidden", true));
	update.addEventListener("click", async () => {
		await sunela.set_time();
		class_toggle(box, "hidden", true);
	});
}


/* --- Show the account list ----------------------------------------------- */


function show_accounts(names)
{
	var div = document.getElementById("accounts");

	es = [];
	for (let name of names) {
		let span = document.createElement("SPAN");

		es.push(span);
		span.className = "entry";
		span.textContent = name;
		span.addEventListener("click", () => open_entry(span, name));
		div.appendChild(span);
	}
}


/* --- Main code ----------------------------------------------------------- */


var sunela = new Sunela();

var button = document.getElementById("button-connect");
var es = []; // list of HTML elements for account entries


async function open_sunela()
{
	var dt, names;

        await sunela.request_usb();
	class_toggle(button, "hidden", true);

	try {
		dt = await sunela.get_time() - Date.now() / 1000;
		names = await sunela.ls();
	} catch (error) {
		console.error(error);
		return;
	}

	if (Math.abs(dt) > MAX_T_DIFF_S)
		update_time(dt);

	show_accounts(names);
}


// Required use of "user gesture":
// https://stackoverflow.com/a/70017650/11496135

button.addEventListener("click", open_sunela);
