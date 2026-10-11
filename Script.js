document.addEventListener("DOMContentLoaded", function () {

    // 1. SHOPPING CART: save products in browser storage

    const CART_KEY = "beanBoutiqueCart";

    function getCart() {
        try {
            const saved = JSON.parse(localStorage.getItem(CART_KEY));
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (error) {
            console.warn("Cart storage is unavailable.");
        }
    }

    function money(amount) {
        return "$" + Number(amount).toFixed(2);
    }

    function updateCartCount() {
        const cart = getCart();
        const count = cart.reduce((sum, item) => sum + item.quantity, 0);

        document.querySelectorAll(".cart-count").forEach(function (element) {
            element.textContent = count;
        });
    }

    function renderCart() {
        const container = document.getElementById("cartItems");

        if (!container) return;

        const cart = getCart();
        container.replaceChildren();

        if (cart.length === 0) {
            const empty = document.createElement("p");
            empty.textContent = "Your basket is empty. Discover your favourites!";
            container.appendChild(empty);
        }

        cart.forEach(function (item) {
            const row = document.createElement("div");
            row.className = "cart-row";

            const details = document.createElement("div");

            const title = document.createElement("h3");
            title.textContent = item.name;

            const price = document.createElement("p");
            price.textContent = money(item.price) + " each";

            const quantity = document.createElement("p");
            quantity.textContent = "Quantity: " + item.quantity;

            details.append(title, price, quantity);

            const actions = document.createElement("div");

            const subtotal = document.createElement("strong");
            subtotal.textContent = money(item.price * item.quantity);

            const remove = document.createElement("button");
            remove.type = "button";
            remove.textContent = "Remove";
            remove.setAttribute("aria-label", "Remove " + item.name);

            remove.addEventListener("click", function () {
                saveCart(getCart().filter(function (product) {
                    return product.id !== item.id;
                }));

                updateCartCount();
                renderCart();
            });

            actions.append(subtotal, document.createElement("br"), remove);
            row.append(details, actions);
            container.appendChild(row);
        });

        const total = cart.reduce(function (sum, item) {
            return sum + item.price * item.quantity;
        }, 0);

        const subtotalElement = document.getElementById("cartSubtotal");
        const totalElement = document.getElementById("cartTotal");

        if (subtotalElement) subtotalElement.textContent = money(total);
        if (totalElement) totalElement.textContent = money(total);
    }

    document.querySelectorAll(".add-cart").forEach(function (button) {
        button.addEventListener("click", function () {
            const id = button.dataset.id;
            const name = button.dataset.name;
            const price = Number(button.dataset.price);

            if (!id  !name  !Number.isFinite(price) || price < 0) {
                return;
            }

            const cart = getCart();
            const existing = cart.find(function (item) {
                return item.id === id;
            });

            if (existing) {
                existing.quantity += 1;
            } else {
                cart.push({
                    id: id,
                    name: name,
                    price: price,
                    quantity: 1
                });
            }saveCart(cart);
            updateCartCount();

            const oldText = button.textContent;
            button.textContent = "Added ✓";

            window.setTimeout(function () {
                button.textContent = oldText;
            }, 1200);
        });
    });

    updateCartCount();
    renderCart();

    const checkoutButton = document.getElementById("checkoutBtn");

    if (checkoutButton) {
        checkoutButton.addEventListener("click", function () {
            const message = document.getElementById("checkoutMessage");

            if (getCart().length === 0) {
                message.textContent = "Your cart is empty. Add a product first.";
            } else {
                message.textContent =
                    "Demo only: online payments are not enabled yet.";
            }
        });
    }


    // 2. COFFEE SEARCH AND CATEGORY FILTER

    const searchInput = document.getElementById("coffeeSearch");
    const coffeeCards = Array.from(
        document.querySelectorAll(".coffee-item")
    );
    const filterButtons = document.querySelectorAll(".filter-btn");
    const searchStatus = document.getElementById("searchStatus");
    const noResults = document.getElementById("noCoffeeResults");

    let selectedCategory = "all";

    function filterCoffee() {
        if (!searchInput) return;

        const query = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;

        coffeeCards.forEach(function (card) {
            const text = card.textContent.toLowerCase();
            const category = card.dataset.category;

            const matchesText = text.includes(query);
            const matchesCategory =
                selectedCategory === "all" ||
                category === selectedCategory;

            const visible = matchesText && matchesCategory;

            card.hidden = !visible;

            if (visible) visibleCount++;
        });

        if (searchStatus) {
            searchStatus.textContent =
                "Showing " + visibleCount + " of " +
                coffeeCards.length + " coffees.";
        }

        if (noResults) {
            noResults.hidden = visibleCount !== 0;
        }
    }

    if (searchInput) {
        searchInput.addEventListener("input", filterCoffee);
    }

    filterButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            selectedCategory = button.dataset.filter;

            filterButtons.forEach(function (item) {
                item.classList.toggle("active", item === button);
            });

            filterCoffee();
        });
    });


    // 3. FIRST-VISIT WELCOME POPUP

    const popup = document.getElementById("welcomePopup");
    const closePopup = document.getElementById("closePopup");
    const newsletterForm = document.getElementById("newsletterForm");
    const newsletterMessage =
        document.getElementById("newsletterMessage");

    function hidePopup() {
        if (popup) popup.hidden = true;
    }

    if (popup && closePopup) {
        let alreadySeen = false;

        try {
            alreadySeen =
                localStorage.getItem("beanBoutiquePopupSeen") === "yes";
        } catch (error) {
            alreadySeen = false;
        }

        if (!alreadySeen) {
            popup.hidden = false;
        }

        closePopup.addEventListener("click", hidePopup);

        popup.addEventListener("click", function (event) {
            if (event.target === popup) hidePopup();
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") hidePopup();
        });
    }

    if (newsletterForm) {
        newsletterForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!newsletterForm.reportValidity()) return;
            if (newsletterMessage) {
                newsletterMessage.textContent =
                    "Thank you! This prototype has recorded your form " +
                    "submission locally in this session only.";
            }

            try {
                localStorage.setItem("beanBoutiquePopupSeen", "yes");
            } catch (error) {
                // The popup still closes if storage is unavailable.
            }

            newsletterForm.reset();
            hidePopup();
        });
    }


    // 4. EVENT REGISTRATION EMAIL

    const eventForm = document.getElementById("eventForm");

    if (eventForm) {
        eventForm.addEventListener("submit", function (event) {
            event.preventDefault();

            if (!eventForm.reportValidity()) return;

            const firstName =
                document.getElementById("firstName").value.trim();

            const lastName =
                document.getElementById("lastName").value.trim();

            const email =
                document.getElementById("eventEmail").value.trim();

            const selectedEvent =
                document.getElementById("eventChoice").value;

            const recipient = "yourshop@example.com";

            const subject = encodeURIComponent(
                "Workshop Registration - " + selectedEvent
            );

            const body = encodeURIComponent(
                "Workshop: " + selectedEvent + "\n" +
                "First Name: " + firstName + "\n" +
                "Last Name: " + lastName + "\n" +
                "Email: " + email
            );

            const message = document.getElementById("eventMessage");

            if (message) {
                message.textContent =
                    "Opening your email app. Replace the sample " +
                    "recipient address with the real shop email.";
            }

            window.location.href =
                "mailto:" + recipient +
                "?subject=" + subject +
                "&body=" + body;
        });
    }

});