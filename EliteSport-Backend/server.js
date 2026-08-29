const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const axios = require("axios");
const mysql = require("mysql2/promise");
const crypto = require("crypto");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || "127.0.0.1",
    user: process.env.DB_USER || "elite",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "EliteSport",
    port: Number(process.env.DB_PORT || 3306),
    waitForConnections: true,
    connectionLimit: 10
});

function hashPassword(password) {
    return crypto.createHash("sha256").update(password).digest("hex");
}

app.get("/", (req, res) => {
    res.json({ message: "Elite Sport Backend is running" });
});

app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const [existingUser] = await db.query(
            "SELECT * FROM Users WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: "Email already exists" });
        }

        const hashedPassword = hashPassword(password);

        const [result] = await db.query(
            `INSERT INTO Users 
            (username, email, password, is_admin, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [username, email, hashedPassword, 0]
        );

        return res.status(201).json({
            message: "Account created successfully",
            user: {
                id: result.insertId,
                username,
                email,
                is_admin: 0
            }
        });

    } catch (error) {
        console.error("Signup error:", error.message);
        return res.status(500).json({
            message: "Signup failed",
            error: error.message
        });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const hashedPassword = hashPassword(password);

        const [users] = await db.query(
            "SELECT * FROM Users WHERE email = ? AND password = ?",
            [email, hashedPassword]
        );

        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = users[0];

        return res.json({
    message: "Login successful",

    token: "elite-sport-demo-token-" + user.id,

    user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin
    }
});

    } catch (error) {
        console.error("Login error:", error.message);
        return res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
});

app.post("/generate-plan", async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                }
            }
        );

        return res.json(response.data);

    } catch (error) {
        console.error("AI error:", error.response?.data || error.message);

        return res.status(500).json({
            message: "AI request failed",
            error: error.response?.data || error.message
        });
    }
});


app.post("/chat", async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Message is required" });
        const response = await axios.post("https://api.groq.com/openai/v1/chat/completions", {
            model: "llama-3.3-70b-versatile",
            max_tokens: 1000,
            messages: [
                { role: "system", content: "You are GymGPT, a professional AI fitness coach. Help with workouts, muscle gain, supplements, gym equipment, fat loss, nutrition, bodybuilding, and motivation. Be concise, practical, and motivating." },
                { role: "user", content: message }
            ]
        }, { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } });
        return res.json(response.data);
    } catch (error) {
        console.error("Chat AI error:", error.response?.data || error.message);
        return res.status(500).json({ message: "AI request failed" });
    }
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error.message);
});

process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
});

const PORT = Number(process.env.PORT || 4000);

app.listen(PORT, () => {
    console.log(`Backend Server is running on http://localhost:${PORT}`);
});

// Keeps the server process alive
setInterval(() => {}, 1000);

app.get("/api/products", async (req, res) => {

    try {

        const [products] = await db.query(`
            SELECT
                Products.*,
                Categories.name AS category_name
            FROM Products
            LEFT JOIN Categories
            ON Products.category_id = Categories.id
        `);

        res.json(products);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Failed to load products"
        });
    }
});
app.get("/api/users", async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT id, username, email, is_admin, createdAt
            FROM Users
            ORDER BY id DESC
        `);

        res.json(users);
    } catch (error) {
        res.status(500).json({
            message: "Failed to load users",
            error: error.message
        });
    }
});
app.post("/api/orders", async (req, res) => {
    const connection = await db.getConnection();

    try {
        const { user_id, items, total_amount } = req.body;

        if (!user_id || !items || items.length === 0) {
            return res.status(400).json({ message: "Missing order data" });
        }

        await connection.beginTransaction();

        const [orderResult] = await connection.query(
            `INSERT INTO Orders (user_id, order_date, total_amount, createdAt, updatedAt)
             VALUES (?, NOW(), ?, NOW(), NOW())`,
            [user_id, total_amount]
        );

        const orderId = orderResult.insertId;

        for (const item of items) {
            if (!item.product_id || !item.quantity || item.price === undefined) {
                throw new Error("Invalid order item data");
            }

            await connection.query(
                `INSERT INTO OrderItems (order_id, product_id, quantity, price, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [orderId, item.product_id, item.quantity, item.price]
            );
        }

        await connection.commit();

        res.status(201).json({
            message: "Order saved",
            order_id: orderId
        });

    } catch (error) {
        await connection.rollback();

        res.status(500).json({
            message: "Order failed",
            error: error.message
        });

    } finally {
        connection.release();
    }
});
app.get("/api/orders", async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT 
                Orders.id,
                Orders.user_id,
                Users.username,
                Orders.order_date,
                Orders.total_amount,
                GROUP_CONCAT(Products.name SEPARATOR ', ') AS products
            FROM Orders
            LEFT JOIN Users ON Orders.user_id = Users.id
            LEFT JOIN OrderItems ON Orders.id = OrderItems.order_id
            LEFT JOIN Products ON OrderItems.product_id = Products.id
            GROUP BY Orders.id
            ORDER BY Orders.id DESC
        `);

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Failed to load orders", error: error.message });
    }
});
app.get("/api/orders/user/:userId", async (req, res) => {
    try {

        const [orders] = await db.query(`
            SELECT 
                Orders.id,
                Orders.user_id,
                Orders.order_date,
                Orders.total_amount,

                GROUP_CONCAT(
                    Products.name SEPARATOR ', '
                ) AS products

            FROM Orders

            LEFT JOIN OrderItems
            ON Orders.id = OrderItems.order_id

            LEFT JOIN Products
            ON OrderItems.product_id = Products.id

            WHERE Orders.user_id = ?

            GROUP BY Orders.id

            ORDER BY Orders.id DESC
        `, [req.params.userId]);

        res.json(orders);

    } catch (error) {

        res.status(500).json({
            message: "Failed to load user orders",
            error: error.message
        });
    }
});
app.put("/api/orders/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        await db.query(
            "UPDATE Orders SET status = ?, updatedAt = NOW() WHERE id = ?",
            [status, req.params.id]
        );

        res.json({ message: "Order status updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update order", error: error.message });
    }
});

app.delete("/api/orders/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM OrderItems WHERE order_id = ?", [req.params.id]);
        await db.query("DELETE FROM Orders WHERE id = ?", [req.params.id]);

        res.json({ message: "Order deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete order", error: error.message });
    }
});

app.put("/api/users/:id", async (req, res) => {
    try {
        const { username, email, is_admin } = req.body;

        await db.query(
            "UPDATE Users SET username = ?, email = ?, is_admin = ?, updatedAt = NOW() WHERE id = ?",
            [username, email, is_admin, req.params.id]
        );

        res.json({ message: "User updated" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update user", error: error.message });
    }
});

app.delete("/api/users/:id", async (req, res) => {
    try {
        await db.query("DELETE FROM Users WHERE id = ?", [req.params.id]);

        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete user", error: error.message });
    }
});