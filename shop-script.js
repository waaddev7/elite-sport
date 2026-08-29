/* ==========================================================
   EliteSport - Smart Shop Logic
   Backend Products + Filters + AI + Cart
   ========================================================== */

const SHOP_API_URL = window.ELITE_API_URL || "http://localhost:4000";

// حطي مفتاح Groq API هون
const GROQ_KEY = "حطي_API_KEY_هون";

// منتجات احتياطية إذا الباك إند وقف
const BACKUP_PRODUCTS = [
    { name: "Adjustable Dumbbells", price: "129.99", category: "strength", img: "https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=500", desc: "Premium cast iron finish, 5-50 lbs range, space-saving design." },
    { name: "Pro Weight Bench", price: "185.00", category: "strength", img: "https://images.unsplash.com/photo-1533228891704-62492d836c3a?w=500", desc: "Steel frame with 7 incline levels for full-body strength training." },
    { name: "Classic Kettlebell", price: "45.00", category: "strength", img: "img/kettlebell.jpg", desc: "Cast iron with textured handle for perfect control and swing." },
    { name: "Resistance Band Set", price: "29.99", category: "resistance", img: "img/Resistance.jpg", desc: "5 tension levels with door anchor and travel bag for home use." },
    { name: "Power Pull-up Bar", price: "59.00", category: "resistance", img: "img/ae19012df360011dbb533df8212ef1cb.jpg", desc: "Wall-mounted heavy steel bar for professional upper body workouts." },
    { name: "Pro Jump Rope", price: "19.99", category: "cardio", img: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=500", desc: "Anti-slip handles with fast rotation ball-bearings for intense cardio." },
    { name: "Heavy Boxing Bag", price: "150.00", category: "cardio", img: "img/Heavy.jpg", desc: "High-impact foam, perfect for home cardio and MMA sessions." },
    { name: "Indoor Spin Bike", price: "399.00", category: "cardio", img: "https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=500", desc: "Magnetic silent resistance with built-in monitor for speed and calories." },
    { name: "Smart Treadmill", price: "899.00", category: "cardio", img: "img/SmartTreadmill.jpg", desc: "Foldable design, Bluetooth enabled for professional training apps." },
    { name: "Eco Yoga Mat", price: "35.00", category: "yoga", img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500", desc: "Dual-layer non-slip texture, 100% biodegradable TPE material." },
    { name: "Yoga Block Set", price: "15.00", category: "yoga", img: "img/Yoga Block Set.jpg", desc: "High-density supportive foam to improve balance and flexibility." },
    { name: "Weightlifting Belt", price: "45.00", category: "strength", img: "img/888.jpg", desc: "Reinforced genuine leather for maximum lumbar and back support." }
];

document.addEventListener("DOMContentLoaded", () => {
    loadProductsSmart();
    initFilterEvents();
    updateCartBadge();
});

// ===============================
// LOAD PRODUCTS
// ===============================
async function loadProductsSmart() {
    const container = document.getElementById("products-grid");

    if (!container) {
        console.error("products-grid not found");
        return;
    }

    try {
        const response = await fetch(`${SHOP_API_URL}/api/products`);

        if (!response.ok) {
            throw new Error("Backend offline");
        }

        const products = await response.json();
        renderProducts(products);

    } catch (error) {
        console.warn("Backend offline, using backup products...");
        renderProducts(BACKUP_PRODUCTS);
    }

    applyInitialFilter();
}

// ===============================
// RENDER PRODUCTS
// ===============================
function renderProducts(products) {
    const container = document.getElementById("products-grid");

    container.innerHTML = "";

    products.forEach(product => {
        const name = product.name || "Product";
        const price = product.price || "0";
        const category = normalizeCategory(product.category || product.category_name || product.type || "strength");
        const image = product.image_url || product.img || product.image || "img/default.jpg";
        const description = product.desc || product.description || "";

        const detailsLink =
            `product-details.html?name=${encodeURIComponent(name)}&price=${encodeURIComponent(price)}&img=${encodeURIComponent(image)}&desc=${encodeURIComponent(description)}&cat=${encodeURIComponent(category)}`;

        container.innerHTML += `
            <div class="product-card" data-category="${category}">
                <a href="${detailsLink}" style="text-decoration:none; color:inherit;">
                    <div class="p-img">
                        <img src="${image}" alt="${name}" onerror="this.src='img/default.jpg'">
                    </div>

                    <div class="p-desc">
                        <h4>${name}</h4>
                        <p class="tool-info">${description}</p>
                    </div>
                </a>

                <div class="p-flex" style="padding:0 25px 25px;">
                    <span>$${price}</span>

                    <button
                        type="button"
                        class="add-cart"
                        onclick="addToCart(event, '${escapeText(name)}', '${price}', '${escapeText(image)}')"
                    >
                        Add
                    </button>
                </div>
            </div>
        `;
    });
}

// ===============================
// FILTER SYSTEM
// ===============================
function initFilterEvents() {
    document.querySelectorAll(".filter-btn").forEach(button => {
        button.addEventListener("click", () => {
            const category = button.getAttribute("data-filter");
            applyFilter(category);
        });
    });

    document.querySelectorAll("#footer-shop-links a, #footer-filter-links a").forEach(link => {
        link.addEventListener("click", event => {
            const category = link.getAttribute("data-filter");

            if (!category) return;

            if (window.location.pathname.includes("shop.html")) {
                event.preventDefault();

                applyFilter(category);

                window.scrollTo({
                    top: 250,
                    behavior: "smooth"
                });
            }
        });
    });
}

function applyInitialFilter() {
    const params = new URLSearchParams(window.location.search);
    const urlFilter = params.get("filter");

    if (urlFilter) {
        applyFilter(normalizeCategory(urlFilter));
    } else {
        applyFilter("all");
    }
}

function applyFilter(category) {
    category = normalizeCategory(category || "all");

    const buttons = document.querySelectorAll(".filter-btn");
    const cards = document.querySelectorAll(".product-card");

    buttons.forEach(button => {
        const buttonFilter = normalizeCategory(button.getAttribute("data-filter"));
        button.classList.toggle("active", buttonFilter === category);
    });

    cards.forEach(card => {
        const cardCategory = normalizeCategory(card.getAttribute("data-category"));

        if (category === "all" || cardCategory === category) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });

    showEmptyMessageIfNeeded(category);
}

function showEmptyMessageIfNeeded(category) {
    const grid = document.getElementById("products-grid");
    const cards = document.querySelectorAll(".product-card");

    if (!grid) return;

    let emptyMsg = document.getElementById("empty-filter-msg");

    if (!emptyMsg) {
        emptyMsg = document.createElement("div");
        emptyMsg.id = "empty-filter-msg";
        emptyMsg.style.padding = "40px";
        emptyMsg.style.textAlign = "center";
        emptyMsg.style.fontSize = "20px";
        emptyMsg.style.color = "#999";
        emptyMsg.style.gridColumn = "1 / -1";
        grid.appendChild(emptyMsg);
    }

    const visibleCards = [...cards].filter(card => card.style.display !== "none");

    if (visibleCards.length === 0) {
        emptyMsg.innerHTML = `No products found for "${category}"`;
        emptyMsg.style.display = "block";
    } else {
        emptyMsg.style.display = "none";
    }
}

function normalizeCategory(category) {
    return String(category || "all").toLowerCase().trim();
}

// ===============================
// AI MODAL
// ===============================
function startSmartAI() {
    const modal = document.getElementById("aiModal");

    if (modal) {
        modal.style.display = "flex";
    }
}

function closeAIModal() {
    const modal = document.getElementById("aiModal");

    if (modal) {
        modal.style.display = "none";
    }
}

function setGoal(goal) {
    const input = document.getElementById("aiInput");

    if (input) {
        input.value = goal;
    }
}

// ===============================
// AI RECOMMENDATION
// ===============================
async function processAIRecommendation() {
    const inputField = document.getElementById("aiInput");
    const goal = inputField ? inputField.value.trim() : "";

    if (!goal) {
        alert("Please enter a goal!");
        return;
    }

    closeAIModal();

    const status = document.getElementById("ai-status");
    const msg = document.getElementById("ai-msg");
    const banner = document.getElementById("ai-banner");

    if (status) {
        status.innerHTML = `<i class="fa-solid fa-brain fa-fade"></i> Elite AI is analyzing your request...`;
    }

    if (msg) {
        msg.innerHTML = "";
    }

    if (banner) {
        banner.style.border = "2px solid #ff6b35";
    }

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_KEY}`
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [
                    {
                        role: "system",
                        content: `
You are an EliteSport Sales Expert.

Based on the user's goal, choose exactly ONE category.

Allowed categories only:
- strength
- cardio
- resistance
- yoga

Return ONLY valid JSON:
{
  "category": "strength/cardio/resistance/yoga",
  "advice": "short helpful advice"
}
                        `
                    },
                    {
                        role: "user",
                        content: goal
                    }
                ],
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            throw new Error("AI API failed");
        }

        const data = await response.json();
        const aiRes = JSON.parse(data.choices[0].message.content);

        executeAIUI(
            normalizeCategory(aiRes.category || "strength"),
            aiRes.advice || "These products match your goal."
        );

    } catch (error) {
        console.warn("AI API offline, using fallback...");
        smartFallback(goal);
    }
}

function smartFallback(goal) {
    const g = goal.toLowerCase();

    let category = "strength";
    let advice = "Strength gear is great for building muscle and power.";

    if (
        g.includes("weight") ||
        g.includes("fat") ||
        g.includes("cardio") ||
        g.includes("run") ||
        g.includes("lose") ||
        g.includes("burn")
    ) {
        category = "cardio";
        advice = "Cardio gear is perfect for burning calories and improving endurance.";
    } else if (
        g.includes("yoga") ||
        g.includes("stretch") ||
        g.includes("flex") ||
        g.includes("mobility")
    ) {
        category = "yoga";
        advice = "Yoga tools help improve flexibility, balance, and recovery.";
    } else if (
        g.includes("tone") ||
        g.includes("band") ||
        g.includes("resistance")
    ) {
        category = "resistance";
        advice = "Resistance bands are perfect for toning and home workouts.";
    } else if (
        g.includes("muscle") ||
        g.includes("strength") ||
        g.includes("build") ||
        g.includes("power")
    ) {
        category = "strength";
        advice = "Strength equipment is ideal for building muscle at home.";
    }

    executeAIUI(category, advice);
}

function executeAIUI(category, advice) {
    category = normalizeCategory(category);

    const status = document.getElementById("ai-status");
    const msg = document.getElementById("ai-msg");

    if (status) {
        status.innerHTML = "AI Recommendation Ready! ✨";
    }

    if (msg) {
        msg.innerHTML = `<b>Elite AI Says:</b> ${advice}`;
    }

    applyFilter(category);

    const target = document.querySelector(`.product-card[data-category="${category}"]`);

    if (target) {
        target.classList.add("ai-highlight");

        target.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

        setTimeout(() => {
            target.classList.remove("ai-highlight");
        }, 5000);
    }
}

// ===============================
// CART SYSTEM
// ===============================
function addToCart(event, name, price, img) {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
        alert("🔒 Please Sign In first to add items to your cart.");

        localStorage.setItem("pendingItem", JSON.stringify({
            name,
            price,
            img
        }));

        window.location.href = "signin.html";
        return;
    }

    const cartIcon = document.querySelector(".cart-icon");
    const flyer = document.createElement("div");

    flyer.className = "flying-item";
    document.body.appendChild(flyer);

    flyer.style.left = `${event.clientX}px`;
    flyer.style.top = `${event.clientY}px`;

    setTimeout(() => {
        if (!cartIcon) return;

        const rect = cartIcon.getBoundingClientRect();

        flyer.style.left = `${rect.left + 15}px`;
        flyer.style.top = `${rect.top + 15}px`;
        flyer.style.transform = "scale(0.2)";
        flyer.style.opacity = "0";
    }, 50);

    setTimeout(() => {
        flyer.remove();

        let cart = JSON.parse(localStorage.getItem("cart")) || [];

        cart.push({
            name,
            price,
            img,
            qty: 1
        });

        localStorage.setItem("cart", JSON.stringify(cart));

        updateCartBadge();

        if (cartIcon) {
            cartIcon.classList.add("cart-shake");

            setTimeout(() => {
                cartIcon.classList.remove("cart-shake");
            }, 400);
        }
    }, 800);
}

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    const badge = document.getElementById("cart-count");

    if (badge) {
        badge.innerText = cart.length;
    }
}

// ===============================
// HELPERS
// ===============================
function escapeText(text) {
    return String(text)
        .replace(/\\/g, "\\\\")
        .replace(/'/g, "\\'")
        .replace(/"/g, "&quot;");
}
function addToWishlist(item) {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userId = localStorage.getItem("userId");

    if (isLoggedIn !== "true" || !userId) {
        alert("Please sign in first.");
        window.location.href = "signin.html";
        return;
    }

    let wishlist = JSON.parse(localStorage.getItem(`wishlist_${userId}`)) || [];

    const exists = wishlist.find(product => Number(product.id) === Number(item.id));

    if (exists) {
        alert("Already in wishlist!");
        return;
    }

    wishlist.push(item);

    localStorage.setItem(`wishlist_${userId}`, JSON.stringify(wishlist));

    alert("Added to wishlist!");
}