document.addEventListener('DOMContentLoaded', renderCart);

function renderCart() {
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('subtotal');
    const totalEl = document.getElementById('grand-total');
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding: 50px;"><h2 style="color:#000">Your cart is empty 🛒</h2><a href="shop.html" style="color:var(--primary-orange); font-weight:bold; text-decoration:none;">Go Shop Now</a></div>`;
        subtotalEl.innerText = "$0.00";
        totalEl.innerText = "$0.00";
        return;
    }

    let html = "";
    let total = 0;

    cart.forEach((item, index) => {
        // تأكدي من أن كل منتج لديه خاصية qty، إذا لا، افترضي 1
        if(!item.qty) item.qty = 1;
        
        const price = parseFloat(item.price.replace('$', ''));
        total += (price * item.qty);

        html += `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}">
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">$${price.toFixed(2)}</p>
                </div>
                <div class="quantity-control">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <span class="qty-num">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
                <button class="btn-remove" onclick="removeItem(${index})"><i class="fa-solid fa-trash-can"></i></button>
            </div>
        `;
    });

    container.innerHTML = html;
    subtotalEl.innerText = `$${total.toFixed(2)}`;
    totalEl.innerText = `$${total.toFixed(2)}`;
    
    // تحديث العداد في الهيدر
    document.getElementById('cart-count').innerText = cart.length;
}

function updateQty(index, change) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    if(!cart[index].qty) cart[index].qty = 1;
    
    cart[index].qty += change;
    
    // منع الكمية من أن تكون أقل من 1
    if (cart[index].qty < 1) cart[index].qty = 1;
    
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function removeItem(index) {
    let cart = JSON.parse(localStorage.getItem('cart'));
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
}

function confirmOrder(e) {
    e.preventDefault();
    
    // جلب المنتجات الموجودة بالسلة حالياً
    const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
    const total = document.getElementById('grand-total').innerText;

    if (cartItems.length === 0) return alert("Your cart is empty!");

    // بناء كائن الطلب "الكامل"
    const newOrder = {
        id: Math.floor(1000 + Math.random() * 9000),
        date: new Date().toLocaleDateString(),
        total: total,
        status: "Processing",
        items: cartItems // <--- هاي أهم نقطة عشان الـ Details تشتغل
    };

    let orders = JSON.parse(localStorage.getItem('userOrders')) || [];
    orders.unshift(newOrder); // وضع الطلب الجديد في البداية
    
    localStorage.setItem('userOrders', JSON.stringify(orders));
    localStorage.removeItem('cart'); // تفريغ السلة

    alert("🎉 Order Confirmed! Check your profile.");
    window.location.href = 'profile.html';
}
// وظيفة التبديل بين طرق الدفع
function togglePayment(method) {
    const cardSection = document.getElementById('card-details');
    const payItems = document.querySelectorAll('.pay-item');
    
    // تحديث شكل الأزرار
    payItems.forEach(item => item.classList.remove('active'));
    event.currentTarget.classList.add('active');

    if (method === 'card') {
        cardSection.style.display = 'block';
    } else {
        cardSection.style.display = 'none';
    }
}

// تحديث وظيفة تأكيد الطلب لتشمل طريقة الدفع
function confirmOrder(e) {
    e.preventDefault();
    
    const payMethod = document.querySelector('input[name="pay_method"]:checked').value;
    const total = document.getElementById('grand-total').innerText;
    
    // إظهار لودينج بسيط ليوحي بالاحترافية
    const btn = e.target.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = "Processing...";
    btn.disabled = true;

    setTimeout(() => {
        // حفظ الطلب في البروفايل
        const cartItems = JSON.parse(localStorage.getItem('cart')) || [];
        const newOrder = {
            id: Math.floor(1000 + Math.random() * 9000),
            date: new Date().toLocaleDateString(),
            total: total,
            status: "Processing",
            payment: payMethod === 'cod' ? "Cash" : "Credit Card",
            items: cartItems
        };

        let orders = JSON.parse(localStorage.getItem('userOrders')) || [];
        orders.unshift(newOrder);
        localStorage.setItem('userOrders', JSON.stringify(orders));
        localStorage.removeItem('cart');

        // رسالة نجاح واو
        alert(`🎉 Success! Your order using ${newOrder.payment} has been placed.`);
        window.location.href = 'profile.html';
    }, 2000); // محاكاة وقت المعالجة 2 ثانية
}