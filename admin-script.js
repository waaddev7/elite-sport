const API_BASE = "http://localhost:4000";

const API_PRODUCTS = `${API_BASE}/api/products`;
const API_USERS = `${API_BASE}/api/users`;
const API_ORDERS = `${API_BASE}/api/orders`;

const DEFAULT_IMAGE =
"https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=200&q=80";

let products = [];
let users = [];
let orders = [];

const productsTable = document.getElementById("productsTable");
const ordersTable = document.getElementById("ordersTable");
const usersTable = document.getElementById("usersTable");

const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");

const modal = document.getElementById("productModal");
const productForm = document.getElementById("productForm");

const userModal = document.getElementById("userModal");
const userForm = document.getElementById("userForm");

const toast = document.getElementById("toast");

function checkAdmin() {

  if (
    localStorage.getItem("isLoggedIn") !== "true" ||
    Number(localStorage.getItem("isAdmin")) !== 1
  ) {

    window.location.href = "signin.html";
  }
}

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function showToast(message) {

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

function categoryToId(category) {

  return {
    Strength: 1,
    Resistance: 2,
    Cardio: 3,
    Yoga: 4
  }[category] || 1;
}

function idToCategory(id, fallback) {

  return (
    fallback ||
    {
      1: "Strength",
      2: "Resistance",
      3: "Cardio",
      4: "Yoga"
    }[id] ||
    "Strength"
  );
}

function stockStatus(stock) {

  if (Number(stock) <= 0) return "Out Stock";
  if (Number(stock) <= 15) return "Low Stock";

  return "In Stock";
}

function badgeClass(status) {

  return String(status)
    .toLowerCase()
    .replaceAll(" ", "-");
}

// =====================
// LOAD DATA
// =====================

async function loadProducts() {

  const response = await fetch(API_PRODUCTS);
  products = await response.json();
}

async function loadUsers() {

  const response = await fetch(API_USERS);
  users = await response.json();
}

async function loadOrders() {

  const response = await fetch(API_ORDERS);
  orders = await response.json();
}

// =====================
// RENDER STATS
// =====================

function renderStats() {

  const revenue =
    orders.reduce((sum, order) => {

      return sum + Number(order.total_amount || 0);

    }, 0);

  document.getElementById("totalProducts").textContent =
    products.length;

  document.getElementById("totalOrders").textContent =
    orders.length;

  document.getElementById("totalRevenue").textContent =
    money(revenue);

  document.getElementById("totalUsers").textContent =
    users.length;
}

// =====================
// PRODUCTS
// =====================

function renderProducts() {

  const search =
    productSearch.value.trim().toLowerCase();

  const category =
    categoryFilter.value;

  const filtered =
    products.filter(product => {

      const productCategory =
        idToCategory(
          product.category_id,
          product.category_name
        );

      return (
        (category === "all" ||
         productCategory === category)

        &&

        (
          String(product.name || "")
            .toLowerCase()
            .includes(search)

          ||

          productCategory
            .toLowerCase()
            .includes(search)
        )
      );
    });

  productsTable.innerHTML =
    filtered.map(product => {

      const categoryName =
        idToCategory(
          product.category_id,
          product.category_name
        );

      const image =
        product.image_url || DEFAULT_IMAGE;

      const status =
        stockStatus(product.stock || 0);

      return `
        <tr>

          <td>
            <div class="product-cell">

              <img
                class="product-img"
                src="${image}"
                alt="${product.name}"
                onerror="this.src='${DEFAULT_IMAGE}'"
              >

              <strong>${product.name}</strong>

            </div>
          </td>

          <td>${categoryName}</td>

          <td>${money(product.price)}</td>

          <td>${product.stock || 0}</td>

          <td>
            <span class="badge ${badgeClass(status)}">
              ${status}
            </span>
          </td>

          <td>

            <div class="action-group">

              <button
                class="icon-btn view"
                onclick="viewProduct(${product.id})"
              >
                👁
              </button>

              <button
                class="icon-btn edit"
                onclick="editProduct(${product.id})"
              >
                ✎
              </button>

              <button
                class="icon-btn delete"
                onclick="deleteProduct(${product.id})"
              >
                🗑
              </button>

            </div>

          </td>

        </tr>
      `;
    }).join("")

    ||

    `<tr>
      <td colspan="6">
        No products found.
      </td>
    </tr>`;
}

function viewProduct(id) {

  const product =
    products.find(
      p => Number(p.id) === Number(id)
    );

  if (!product) return;

  alert(`
${product.name}

Category:
${idToCategory(product.category_id)}

Price:
${money(product.price)}

Stock:
${product.stock}

${product.description || ""}
`);
}

function editProduct(id) {

  const product =
    products.find(
      p => Number(p.id) === Number(id)
    );

  if (!product) return;

  document.getElementById("productId").value =
    product.id;

  document.getElementById("productName").value =
    product.name;

  document.getElementById("productCategory").value =
    idToCategory(
      product.category_id,
      product.category_name
    );

  document.getElementById("productPrice").value =
    product.price;

  document.getElementById("productStock").value =
    product.stock || 0;

  document.getElementById("productImage").value =
    product.image_url || "";

  document.getElementById("productDescription").value =
    product.description || "";

  openModal("Edit Product");
}

async function deleteProduct(id) {

  if (!confirm("Delete this product?"))
    return;

  const response =
    await fetch(`${API_PRODUCTS}/${id}`, {
      method: "DELETE"
    });

  if (!response.ok) {

    showToast("Delete failed");
    return;
  }

  showToast("Product deleted");

  await reloadDashboard();
}

// =====================
// USERS
// =====================

function renderUsers() {

  usersTable.innerHTML =
    users.map(user => {

      const role =
        Number(user.is_admin) === 1
        ? "Admin"
        : "Customer";

      return `
        <tr>

          <td>
            <div class="user-cell">

              <div class="user-avatar">
                ${(user.username || "U")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <strong>
                ${user.username || "User"}
              </strong>

            </div>
          </td>

          <td>${user.email || ""}</td>

          <td>${role}</td>

          <td>
            <span class="badge active">
              Active
            </span>
          </td>

          <td>

            <div class="action-group">

              <button
                class="icon-btn edit"
                onclick="editUser(${user.id})"
              >
                ✎
              </button>

              <button
                class="icon-btn delete"
                onclick="deleteUser(${user.id})"
              >
                🗑
              </button>

            </div>

          </td>

        </tr>
      `;
    }).join("")

    ||

    `<tr>
      <td colspan="5">
        No users found.
      </td>
    </tr>`;
}

function editUser(id) {

  const user =
    users.find(
      u => Number(u.id) === Number(id)
    );

  if (!user) return;

  document.getElementById("editUserId").value =
    user.id;

  document.getElementById("editUsername").value =
    user.username;

  document.getElementById("editUserEmail").value =
    user.email;

  document.getElementById("editUserRole").value =
    user.is_admin;

  userModal.classList.add("show");
}

async function deleteUser(id) {

  if (!confirm("Delete this user?"))
    return;

  const response =
    await fetch(`${API_USERS}/${id}`, {
      method: "DELETE"
    });

  if (!response.ok) {

    showToast("Delete failed");
    return;
  }

  showToast("User deleted");

  await reloadDashboard();
}

// =====================
// ORDERS
// =====================

function renderOrders() {

  ordersTable.innerHTML =
    orders.map(order => {

      const status =
        order.status || "Processing";

      return `
        <tr>

          <td>
            <strong>
              ORD-${order.id}
            </strong>
          </td>

          <td>
            ${order.username ||
              "User #" + order.user_id}
          </td>

          <td>
            ${order.products || "No products"}
          </td>

          <td>
            ${money(order.total_amount)}
          </td>

          <td>
            ${
              order.order_date
              ? new Date(order.order_date)
                .toLocaleDateString()
              : "-"
            }
          </td>

          <td>

            <select
              onchange="
                updateOrderStatus(
                  ${order.id},
                  this.value
                )
              "
            >

              <option
                value="Processing"
                ${status === "Processing" ? "selected" : ""}
              >
                Processing
              </option>

              <option
                value="Delivered"
                ${status === "Delivered" ? "selected" : ""}
              >
                Delivered
              </option>

              <option
                value="Cancelled"
                ${status === "Cancelled" ? "selected" : ""}
              >
                Cancelled
              </option>

            </select>

          </td>

          <td>

            <button
              class="icon-btn delete"
              onclick="deleteOrder(${order.id})"
            >
              🗑
            </button>

          </td>

        </tr>
      `;
    }).join("")

    ||

    `<tr>
      <td colspan="7">
        No orders found.
      </td>
    </tr>`;
}

async function updateOrderStatus(id, status) {

  const response =
    await fetch(
      `${API_ORDERS}/${id}/status`,
      {
        method: "PUT",

        headers: {
          "Content-Type":
          "application/json"
        },

        body: JSON.stringify({
          status
        })
      }
    );

  if (!response.ok) {

    showToast("Update failed");
    return;
  }

  showToast("Order updated");

  await reloadDashboard();
}

async function deleteOrder(id) {

  if (!confirm("Delete this order?"))
    return;

  const response =
    await fetch(`${API_ORDERS}/${id}`, {
      method: "DELETE"
    });

  if (!response.ok) {

    showToast("Delete failed");
    return;
  }

  showToast("Order deleted");

  await reloadDashboard();
}

// =====================
// RENDER ALL
// =====================

function renderAll() {

  renderStats();
  renderProducts();
  renderUsers();
  renderOrders();
}

async function reloadDashboard() {

  await loadProducts();
  await loadUsers();
  await loadOrders();

  renderAll();
}

// =====================
// MODALS
// =====================

function openModal(title = "Add Product") {

  document.getElementById("modalTitle")
    .textContent = title;

  modal.classList.add("show");
}

function closeModal() {

  modal.classList.remove("show");

  productForm.reset();

  document.getElementById("productId").value = "";
}

function closeUserModal() {

  userModal.classList.remove("show");
}

// =====================
// SAVE PRODUCT
// =====================

productForm.addEventListener(
  "submit",

  async event => {

    event.preventDefault();

    const id =
      document.getElementById("productId").value;

    const productData = {

      name:
        document.getElementById("productName")
          .value.trim(),

      description:
        document.getElementById("productDescription")
          .value.trim(),

      price:
        Number(
          document.getElementById("productPrice")
            .value
        ),

      stock:
        Number(
          document.getElementById("productStock")
            .value
        ),

      image_url:
        document.getElementById("productImage")
          .value.trim()

        ||

        DEFAULT_IMAGE,

      category_id:
        categoryToId(
          document.getElementById("productCategory")
            .value
        )
    };

    const response =
      await fetch(
        id
        ? `${API_PRODUCTS}/${id}`
        : API_PRODUCTS,

        {
          method: id ? "PUT" : "POST",

          headers: {
            "Content-Type":
            "application/json"
          },

          body:
            JSON.stringify(productData)
        }
      );

    if (!response.ok) {

      showToast("Save failed");
      return;
    }

    showToast(
      id
      ? "Product updated"
      : "Product added"
    );

    closeModal();

    await reloadDashboard();
  }
);

// =====================
// SAVE USER
// =====================

userForm.addEventListener(
  "submit",

  async event => {

    event.preventDefault();

    const id =
      document.getElementById("editUserId")
        .value;

    const userData = {

      username:
        document.getElementById("editUsername")
          .value,

      email:
        document.getElementById("editUserEmail")
          .value,

      is_admin:
        Number(
          document.getElementById("editUserRole")
            .value
        )
    };

    const response =
      await fetch(`${API_USERS}/${id}`, {

        method: "PUT",

        headers: {
          "Content-Type":
          "application/json"
        },

        body:
          JSON.stringify(userData)
      });

    if (!response.ok) {

      showToast("Update failed");
      return;
    }

    showToast("User updated");

    closeUserModal();

    await reloadDashboard();
  }
);

// =====================
// EVENTS
// =====================

document
  .getElementById("openProductModal")
  .addEventListener("click", () => {
    openModal("Add Product");
  });

document
  .getElementById("closeProductModal")
  .addEventListener("click", closeModal);

document
  .getElementById("cancelProduct")
  .addEventListener("click", closeModal);

document
  .getElementById("closeUserModal")
  .addEventListener("click", closeUserModal);

document
  .getElementById("cancelUserEdit")
  .addEventListener("click", closeUserModal);

modal.addEventListener("click", event => {

  if (event.target === modal)
    closeModal();
});

userModal.addEventListener("click", event => {

  if (event.target === userModal)
    closeUserModal();
});

productSearch.addEventListener(
  "input",
  renderProducts
);

categoryFilter.addEventListener(
  "change",
  renderProducts
);

document
  .getElementById("menuBtn")
  .addEventListener("click", () => {

    document
      .getElementById("sidebar")
      .classList.toggle("open");
  });

document
  .getElementById("logoutBtn")
  .addEventListener("click", () => {

    localStorage.clear();

    window.location.href =
      "signin.html";
  });

document
  .querySelectorAll(".nav-link")
  .forEach(link => {

    link.addEventListener("click", () => {

      document
        .querySelectorAll(".nav-link")
        .forEach(item =>
          item.classList.remove("active")
        );

      link.classList.add("active");
    });
  });

checkAdmin();
reloadDashboard();