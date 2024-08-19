/*
 * main.js - Sunela Web UI
 *
 * This work is licensed under the terms of the MIT License.
 * A copy of the license can be found in the file LICENSE.MIT
 */

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


// Required use of "user gesture":
// https://stackoverflow.com/a/70017650/11496135

sunela = new Sunela();
button = document.getElementById("button-connect");


async function open_sunela()
{
	var names;
	var es = [];

        await sunela.request_usb();
	class_toggle(button, "hidden", true);
	names = await sunela.ls();

	var div = document.getElementById("accounts");

	for (let name of names) {
		var span = document.createElement("SPAN");

		es.push(span);
		span.className = "entry";
		span.textContent = name;
		span.addEventListener("click", () => console.log(name));
		div.appendChild(span);
	}
        console.log(await sunela.ls());
}


button.addEventListener("click", open_sunela);
