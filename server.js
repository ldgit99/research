const path = require("path");
const crypto = require("crypto");
const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET;
const SESSION_HOURS = Number(process.env.SESSION_HOURS || 8);
const RESEARCH_AGENT_URL = process.env.RESEARCH_AGENT_URL || "https://research-agent-ldgit99.streamlit.app/";
const PASSWORD_HASH = process.env.DASHBOARD_PASSWORD_HASH;
const PLAIN_PASSWORD = process.env.DASHBOARD_PASSWORD;
const SESSION_COOKIE = "dashboard_session";

if (!JWT_SECRET) {
    throw new Error("Missing JWT_SECRET environment variable.");
}

if (!PASSWORD_HASH && !PLAIN_PASSWORD) {
    throw new Error("Set DASHBOARD_PASSWORD_HASH or DASHBOARD_PASSWORD in environment variables.");
}

if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
}

app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());
app.use(express.static(__dirname));

function safeEqual(left, right) {
    const leftBuffer = Buffer.from(String(left), "utf8");
    const rightBuffer = Buffer.from(String(right), "utf8");

    if (leftBuffer.length !== rightBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

async function verifyPassword(inputPassword) {
    if (!inputPassword) {
        return false;
    }

    if (PASSWORD_HASH) {
        return bcrypt.compare(inputPassword, PASSWORD_HASH);
    }

    return safeEqual(inputPassword, PLAIN_PASSWORD || "");
}

function signSessionToken() {
    return jwt.sign({ scope: "research-access" }, JWT_SECRET, {
        expiresIn: `${SESSION_HOURS}h`
    });
}

function readSession(req) {
    const token = req.cookies[SESSION_COOKIE];
    if (!token) {
        return null;
    }

    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (_error) {
        return null;
    }
}

function setSessionCookie(res, token) {
    res.cookie(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: SESSION_HOURS * 60 * 60 * 1000,
        path: "/"
    });
}

app.get("/auth/status", (req, res) => {
    const session = readSession(req);
    res.json({ authenticated: Boolean(session) });
});

app.post("/auth/login", async (req, res) => {
    const password = typeof req.body?.password === "string" ? req.body.password : "";
    const valid = await verifyPassword(password);

    if (!valid) {
        res.status(401).json({ message: "Invalid password" });
        return;
    }

    const token = signSessionToken();
    setSessionCookie(res, token);
    res.json({ ok: true });
});

app.post("/auth/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, { path: "/" });
    res.json({ ok: true });
});

app.get("/go/research", (req, res) => {
    const session = readSession(req);

    if (!session) {
        res.redirect(302, "/?loginRequired=1");
        return;
    }

    res.redirect(302, RESEARCH_AGENT_URL);
});

app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
    console.log(`Dashboard server running on http://localhost:${PORT}`);
});
