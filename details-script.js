document.addEventListener('DOMContentLoaded', () => {

    // =========================
    // GET PRODUCT DATA FROM URL
    // =========================

    const params = new URLSearchParams(window.location.search);

    const pName = params.get('name');
    const pPrice = params.get('price');
    const pImg = params.get('img');
    const pDesc = params.get('desc');
    const pCat = params.get('cat');

    // =========================
    // FILL PAGE DATA
    // =========================

    if (pName) {

        document.getElementById('detName').innerText = pName;
        document.getElementById('detPrice').innerText = `$${pPrice}`;
        document.getElementById('detImg').src = pImg;
        document.getElementById('detDesc').innerText = pDesc;
        document.getElementById('detCat').innerText = pCat.toUpperCase();
        document.getElementById('catNameSpan').innerText = pCat;
    }

    // =========================
    // ADD TO CART
    // =========================

    const addBtnDetails =
        document.getElementById('addBtnDetails');

    if (addBtnDetails) {

        addBtnDetails.addEventListener('click', (e) => {

            const isLoggedIn =
                localStorage.getItem("isLoggedIn");

            const userId =
                localStorage.getItem("userId");

            if (isLoggedIn !== "true" || !userId) {

                alert("Please sign in first.");

                window.location.href = "signin.html";

                return;
            }

            const qty =
                parseInt(
                    document.getElementById('qtyVal').innerText
                ) || 1;

            const cartIcon =
                document.querySelector('.cart-icon');

            const btnRect =
                addBtnDetails.getBoundingClientRect();

            const cartRect =
                cartIcon.getBoundingClientRect();

            // Flying animation
            const flyer =
                document.createElement('div');

            flyer.className = 'flying-item';

            document.body.appendChild(flyer);

            flyer.style.left =
                `${btnRect.left + btnRect.width / 2}px`;

            flyer.style.top =
                `${btnRect.top + btnRect.height / 2}px`;

            setTimeout(() => {

                flyer.style.left =
                    `${cartRect.left + cartRect.width / 2}px`;

                flyer.style.top =
                    `${cartRect.top + cartRect.height / 2}px`;

                flyer.style.transform = 'scale(0.2)';
                flyer.style.opacity = '0';

            }, 50);

            setTimeout(() => {

                flyer.remove();

                let cart =
                    JSON.parse(
                        localStorage.getItem('cart')
                    ) || [];

                for (let i = 0; i < qty; i++) {

                    cart.push({
                        product_id: Date.now() + i,
                        name: pName,
                        price: pPrice,
                        img: pImg,
                        qty: 1
                    });
                }

                localStorage.setItem(
                    'cart',
                    JSON.stringify(cart)
                );

                if (typeof updateCartCount === "function") {

                    updateCartCount();
                }

                cartIcon.classList.add('cart-shake');

                setTimeout(() => {

                    cartIcon.classList.remove('cart-shake');

                }, 400);

                addBtnDetails.innerHTML =
                    'Added to Cart ✓';

                addBtnDetails.style.background =
                    '#34c759';

                setTimeout(() => {

                    addBtnDetails.innerHTML =
                        'Add to Cart <i class="fa-solid fa-cart-shopping"></i>';

                    addBtnDetails.style.background =
                        '#000';

                }, 2000);

            }, 800);
        });
    }

    // =========================
    // WISHLIST
    // =========================

    const wishlistBtn =
        document.querySelector('.btn-wishlist');

    if (wishlistBtn && pName) {

        const userId =
            localStorage.getItem("userId");

        if (userId) {

            let wishlist =
                JSON.parse(
                    localStorage.getItem(`wishlist_${userId}`)
                ) || [];

            const exists =
                wishlist.some(
                    item => item.name === pName
                );

            if (exists) {

                wishlistBtn.innerHTML =
                    '<i class="fa-solid fa-heart" style="color:#ff6b35;"></i>';
            }
        }

        wishlistBtn.addEventListener('click', () => {

            const isLoggedIn =
                localStorage.getItem("isLoggedIn");

            const userId =
                localStorage.getItem("userId");

            if (isLoggedIn !== "true" || !userId) {

                alert("Please sign in first.");

                window.location.href = "signin.html";

                return;
            }

            let wishlist =
                JSON.parse(
                    localStorage.getItem(`wishlist_${userId}`)
                ) || [];

            const exists =
                wishlist.find(
                    item => item.name === pName
                );

            if (exists) {

                wishlist =
                    wishlist.filter(
                        item => item.name !== pName
                    );

                wishlistBtn.innerHTML =
                    '<i class="fa-regular fa-heart"></i>';

                alert("Removed from wishlist.");
            }
            else {

                wishlist.push({
                    id: Date.now(),
                    name: pName,
                    price: `$${pPrice}`,
                    img: pImg,
                    cat: pCat
                });

                wishlistBtn.innerHTML =
                    '<i class="fa-solid fa-heart" style="color:#ff6b35;"></i>';

                alert("Added to wishlist!");
            }

            localStorage.setItem(
                `wishlist_${userId}`,
                JSON.stringify(wishlist)
            );
        });
    }

    // =========================
    // RELATED PRODUCTS
    // =========================

    loadRelatedProducts(pCat);
});

// =========================
// CHANGE QUANTITY
// =========================

let qty = 1;

function changeQty(amount) {

    qty += amount;

    if (qty < 1) qty = 1;

    document.getElementById('qtyVal').innerText = qty;
}

// =========================
// RELATED PRODUCTS
// =========================

function loadRelatedProducts(currentCat) {

    const grid =
        document.getElementById('suggestionGrid');

    const allProducts = [

        {
            name: "Pro Jump Rope",
            price: "19.99",
            img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
            cat: "cardio"
        },

        {
            name: "Classic Kettlebell",
            price: "45.00",
            img: "img/kettlebell.jpg",
            cat: "strength"
        },

        {
            name: "Eco Yoga Mat",
            price: "35.00",
            img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400",
            cat: "yoga"
        }
    ];

    let html = "";

    allProducts.forEach(item => {

        html += `
            <a href="
                product-details.html
                ?name=${item.name}
                &price=${item.price}
                &img=${item.img}
                &desc=Professional Elite Gear.
                &cat=${item.cat}
            " class="suggest-card">

                <img src="${item.img}" alt="">

                <h4>${item.name}</h4>

                <p style="
                    color:var(--primary-orange);
                    font-weight:800;
                ">
                    $${item.price}
                </p>

            </a>
        `;
    });

    grid.innerHTML = html;
}