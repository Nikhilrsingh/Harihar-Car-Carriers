/* =========================================================
   HARIHAR CARGO CARRIERS
   STOP LOCATIONS
========================================================= */


/* =========================================================
   LOCATIONS DATA

   Your locations are stored locally here.

   latitude + longitude are used to open
   the exact location in Google Maps.
========================================================= */

const locations = [

    {
        id: 1,

        name: "Home",

        city: "Nagpur, Maharashtra",

        address: "Wadi Parking",

        latitude: 21.155919,
        longitude: 78.993731,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Washroom",
            // "Fuel"
        ]
    },


    {
        id: 2,

        name: "Rajasthani Hotel",

        city: "Nagpur, Maharashtra",

        address: "Gondkhairi Loading Point",

        latitude: 21.123969,
        longitude: 78.924723,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Washroom"
        ]
    },


    {
        id: 3,

        name: "Indian Warehouse",

        city: "Nagpur, Maharashtra",

        address: "Spinny Vardhamna Yard",

        latitude: 21.131943,
        longitude: 78.938572,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel"
        ]
    },


    {
        id: 4,

        name: "Dhaba Tolltax",

        city: "Nagpur, Maharashtra",

        address: "Loading Point",

        latitude: 21.158357,
        longitude: 79.010546,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Washroom"
        ]
    },


    {
        id: 5,

        name: "Himanshu Tea Stall",

        city: "Nagpur, Maharashtra",

        address: "Priyanshu Jamtha Tappri",

        latitude: 21.01755734379684,
        longitude: 79.04745439636899,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 6,

        name: "Maruti Yard Bypass",

        city: "Nagpur, Maharashtra",

        address: "Jamtha Loading Point",

        latitude: 21.023827,
        longitude: 79.061839,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 7,

        name: "Jamtha Parking",

        city: "Nagpur, Maharashtra",

        address: "Vk2 Bar K Piche",

        latitude: 21.024530,
        longitude: 79.061410,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 8,

        name: "Car24 Bypass",

        city: "Nagpur, Maharashtra",

        address: "Wathoda Loading Point",

        latitude: 21.103830,
        longitude: 79.181395,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 9,

        name: "Car24 Yard Nagpur",

        city: "Nagpur, Maharashtra",

        address: "Wathoda Chamat Yard",

        latitude: 21.124256,
        longitude: 79.146227,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 10,

        name: "Spinny Mini Park",

        city: "Nagpur, Maharashtra",

        address: "Spinny Hub",

        latitude: 21.139539,
        longitude: 79.089157,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 11,

        name: "National Car Care",

        city: "Nagpur, Maharashtra",

        address: "Spinny Partner Workshop",

        latitude: 21.141755,
        longitude: 79.180920,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 12,

        name: "Sagar Automobile",

        city: "Nagpur, Maharashtra",

        address: "Spinny Workshop",

        latitude: 21.058770,
        longitude: 79.054877,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 13,

        name: "Car24 Amravati",

        city: "Amravati, Maharashtra",

        address: "Amravati Bless Of Jejus Yard",

        latitude: 20.887174,
        longitude: 77.764366,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    },


    {
        id: 14,

        name: "Satkar Toyota",

        city: "Chhindwara, Madhya Pradesh",

        address: "Chhindwara Showroom",

        latitude: 21.988212,
        longitude: 78.929203,

        facilities: [
            // "Truck Parking",
            // "Food",
            // "Fuel",
            // "Washroom"
        ]
    }

];


/* =========================================================
   ELEMENTS
========================================================= */

const locationsContainer =
    document.getElementById("locationsContainer");

const locationCount =
    document.getElementById("locationCount");

const searchInput =
    document.getElementById("searchInput");

const clearSearch =
    document.getElementById("clearSearch");

const noResults =
    document.getElementById("noResults");


/* =========================================================
   GOOGLE MAPS URL
========================================================= */

function getGoogleMapsUrl(location) {

    return (
        "https://www.google.com/maps/search/?api=1" +
        "&query=" +
        encodeURIComponent(
            `${location.latitude},${location.longitude}`
        )
    );
}


/* =========================================================
   OPEN LOCATION
========================================================= */

function openLocation(locationId) {

    const location =
        locations.find(
            item => item.id === locationId
        );

    if (!location) return;

    const mapsUrl =
        getGoogleMapsUrl(location);

    /*
        Google Maps URL.

        Android:
        Google Maps may open directly
        if installed.

        iPhone:
        Google Maps may open if installed,
        otherwise browser/Maps handling.

        Desktop:
        Google Maps opens in browser.
    */

    window.open(
        mapsUrl,
        "_blank",
        "noopener,noreferrer"
    );
}


/* =========================================================
   WHATSAPP SHARE
========================================================= */

function shareOnWhatsApp(locationId) {

    const location =
        locations.find(
            item => item.id === locationId
        );

    if (!location) return;


    const mapsUrl =
        getGoogleMapsUrl(location);


    const message =
        `📍 ${location.name}\n\n` +
        `${location.address}\n\n` +
        `🗺️ Location:\n${mapsUrl}`;


    /*
        WhatsApp receives the prepared message.

        On mobile:
        WhatsApp opens and the user can
        choose the person/group to send it to.

        On desktop:
        WhatsApp Web opens when available.
    */

    const whatsappUrl =
        `https://wa.me/?text=${encodeURIComponent(message)}`;


    window.open(
        whatsappUrl,
        "_blank"
    );
}


/* =========================================================
   NATIVE SHARE
========================================================= */

async function shareLocation(locationId) {

    const location =
        locations.find(
            item => item.id === locationId
        );

    if (!location) return;


    const mapsUrl =
        getGoogleMapsUrl(location);


    const message =
        `📍 ${location.name}\n` +
        `${location.address}\n` +
        `🗺️ ${mapsUrl}`;


    /*
        Use native device sharing
        when supported.
    */

    if (
        navigator.share &&
        typeof navigator.share === "function"
    ) {

        try {

            await navigator.share({

                title: location.name,

                text: message,

                url: mapsUrl

            });

        } catch (error) {

            /*
                User cancelled sharing.
            */

        }

        return;
    }


    /*
        Fallback.
    */

    copyLocation(message);
}


/* =========================================================
   COPY LOCATION
========================================================= */

async function copyLocation(text) {

    try {

        await navigator.clipboard.writeText(
            text
        );

        showMessage(
            "Location link copied"
        );

    } catch (error) {

        copyUsingFallback(text);

    }
}


/* =========================================================
   OLD BROWSER COPY FALLBACK
========================================================= */

function copyUsingFallback(text) {

    const textarea =
        document.createElement("textarea");

    textarea.value = text;

    textarea.style.position = "fixed";

    textarea.style.left = "-9999px";

    document.body.appendChild(
        textarea
    );

    textarea.select();

    document.execCommand("copy");

    textarea.remove();

    showMessage(
        "Location link copied"
    );
}


/* =========================================================
   TOAST MESSAGE
========================================================= */

function showMessage(message) {

    const oldToast =
        document.querySelector(
            ".toast-message"
        );

    if (oldToast) {
        oldToast.remove();
    }


    const messageBox =
        document.createElement("div");

    messageBox.className =
        "toast-message";

    messageBox.textContent =
        message;

    document.body.appendChild(
        messageBox
    );


    setTimeout(() => {

        messageBox.classList.add(
            "toast-hide"
        );

        setTimeout(() => {

            messageBox.remove();

        }, 250);

    }, 1800);
}


/* =========================================================
   CREATE LOCATION CARD
========================================================= */

function createLocationCard(location) {

    const card =
        document.createElement("article");

    card.className =
        "location-card";


    card.innerHTML = `

        <!-- Location heading -->

        <div class="location-top">

            <div class="location-icon">
                📍
            </div>

            <div class="location-heading">

                <h2 class="location-name">
                    ${location.name}
                </h2>

                <p class="location-city">
                    ${location.city}
                </p>

            </div>

        </div>


        <!-- Address -->

        <div class="location-address">

            <span class="address-icon">
                📌
            </span>

            <p class="address-text">
                ${location.address}
            </p>

        </div>


        <!-- Facilities -->

        <div class="facilities">

            ${location.facilities
                .map(
                    facility => `
                        <span class="facility">
                            ${facility}
                        </span>
                    `
                )
                .join("")}

        </div>


        <!-- Actions -->

        <div class="location-actions">


            <!-- OPEN MAPS -->

            <button
                type="button"
                class="open-btn"
                onclick="openLocation(${location.id})"
            >

                <span>
                    🗺️
                </span>

                <span>
                    Open Maps
                </span>

            </button>


            <!-- WHATSAPP -->

            <button
                type="button"
                class="whatsapp-btn"
                onclick="shareOnWhatsApp(${location.id})"
            >

                <span>
                    🟢
                </span>

                <span>
                    WhatsApp
                </span>

            </button>


            <!-- NATIVE SHARE -->

            <button
                type="button"
                class="share-btn"
                onclick="shareLocation(${location.id})"
                aria-label="Share location"
                title="Share location"
            >
                ↗
            </button>


        </div>

    `;


    return card;
}


/* =========================================================
   RENDER LOCATIONS
========================================================= */

function renderLocations(list) {

    locationsContainer.innerHTML = "";

    locationCount.textContent =
        list.length;


    if (list.length === 0) {

        noResults.classList.remove(
            "hidden"
        );

        return;
    }


    noResults.classList.add(
        "hidden"
    );


    list.forEach(location => {

        const card =
            createLocationCard(
                location
            );

        locationsContainer.appendChild(
            card
        );

    });
}


/* =========================================================
   SEARCH
========================================================= */

function performSearch() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    /*
        Show/hide clear button
    */

    clearSearch.classList.toggle(
        "visible",
        searchTerm.length > 0
    );


    const filtered =
        locations.filter(location => {

            const searchableText = [

                location.name,

                location.city,

                location.address,

                ...location.facilities

            ]
                .join(" ")
                .toLowerCase();


            return searchableText
                .includes(searchTerm);

        });


    renderLocations(
        filtered
    );
}


/* =========================================================
   SEARCH INPUT
========================================================= */

searchInput.addEventListener(
    "input",
    performSearch
);


/* =========================================================
   CLEAR SEARCH
========================================================= */

clearSearch.addEventListener(
    "click",
    function () {

        searchInput.value = "";

        searchInput.focus();

        performSearch();

    }
);


/* =========================================================
   INITIAL LOAD
========================================================= */

renderLocations(
    locations
);