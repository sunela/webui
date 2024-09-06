/*
 * main.js - Sunela Web UI
 *
 * This work is licensed under the terms of the MIT License.
 * A copy of the license can be found in the file LICENSE.MIT
 */


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
	if (is_string(e))
		e = document.getElementById(e);
	e.className = e.className.replace(" " + name, "");
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


/* --- Main code ----------------------------------------------------------- */


var sunela = new Sunela();

var button = document.getElementById("button-connect");
var es = [];


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


async function open_sunela()
{
	var names;

        await sunela.request_usb();
	class_toggle(button, "hidden", true);

	try {
		names = await sunela.ls();
	} catch (error) {
		console.error(error);
		return;
	}

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


// Required use of "user gesture":
// https://stackoverflow.com/a/70017650/11496135

button.addEventListener("click", open_sunela);
