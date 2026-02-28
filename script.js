const agents = [
    {
        id: "collector",
        icon: "🗞️",
        name: "Daily Paper Digest",
        description: "교육공학/AI 교육 트렌드 논문을 수집하고 중복을 제거해 일일 다이제스트를 생성합니다(이메일, 옵시디언 연동).",
        status: "online",
        lastRunDate: "2026-02-28 11:20",
        recentKeyword: "learning analytics",
        keywords: ["MOOC", "assessment", "personalization"],
        metrics: [
            { label: "오늘 수집", value: "42편" },
            { label: "중복 제거", value: "11편" },
            { label: "요약 완료", value: "31편" },
            { label: "업데이트", value: "15분 주기" }
        ]
    },
    {
        id: "summarizer",
        icon: "🔬",
        name: "Research Agent",
        description: "교육공학 분야 논문을 탐색하고 핵심 기여, 한계, 후속 연구 아이디어를 요약하여 보고서를 작성합니다(옵시디언 연동)",
        status: "online",
        lastRunDate: "2026-02-28 11:34",
        recentKeyword: "prompt scaffolding",
        keywords: ["CSCL", "RAG", "feedback loop"],
        launchPath: "https://research-agent-ldgit99.streamlit.app/",
        protectedPath: "/go/research",
        requiresAuth: true,
        buttonText: "열기",
        highlight: true,
        metrics: [
            { label: "최근 실행", value: "2026-02-28" },
            { label: "오늘 분석", value: "18편" },
            { label: "보고서 초안", value: "6건" },
            { label: "동기화", value: "Obsidian" }
        ]
    },
    {
        id: "publisher",
        icon: "📤",
        name: "Report Publisher",
        description: "검수된 연구 요약을 팀 위키와 메신저 채널에 맞춰 발행하고 이력을 관리합니다.",
        status: "degraded",
        lastRunDate: "2026-02-28 10:58",
        recentKeyword: "weekly brief",
        keywords: ["Notion", "Slack", "Versioning"],
        metrics: [
            { label: "오늘 발행", value: "9건" },
            { label: "예약 대기", value: "3건" },
            { label: "실패 재시도", value: "1건" },
            { label: "승인 필요", value: "2건" }
        ]
    }
];

const statusMap = {
    online: { label: "Online", className: "ok" },
    degraded: { label: "Degraded", className: "warn" },
    offline: { label: "Offline", className: "down" }
};

const authState = {
    authenticated: false,
    apiAvailable: true
};

const isGitHubPages = window.location.hostname.endsWith("github.io");

const authStatusEl = document.querySelector("#authStatus");
const authMessageEl = document.querySelector("#authMessage");
const loginToggleBtn = document.querySelector("#loginToggleBtn");
const logoutBtn = document.querySelector("#logoutBtn");
const loginForm = document.querySelector("#loginForm");
const loginSubmitBtn = document.querySelector("#loginSubmitBtn");
const passwordInput = document.querySelector("#passwordInput");

function setAuthMessage(message, type = "") {
    authMessageEl.textContent = message || "";
    authMessageEl.classList.remove("auth-message--error", "auth-message--success");

    if (type === "error") {
        authMessageEl.classList.add("auth-message--error");
    }

    if (type === "success") {
        authMessageEl.classList.add("auth-message--success");
    }
}

function renderAuthStatus() {
    authStatusEl.classList.remove("auth-status--ok", "auth-status--warn");

    if (!authState.apiAvailable) {
        authStatusEl.textContent = isGitHubPages
            ? "GitHub Pages 모드: 인증 서버 없음"
            : "인증 서버 연결 실패";
        authStatusEl.classList.add("auth-status--warn");
        loginToggleBtn.hidden = isGitHubPages;
        logoutBtn.hidden = true;
        loginForm.hidden = true;
        return;
    }

    if (authState.authenticated) {
        authStatusEl.textContent = "연구 에이전트 인증됨";
        authStatusEl.classList.add("auth-status--ok");
        loginToggleBtn.hidden = true;
        logoutBtn.hidden = false;
        loginForm.hidden = true;
    } else {
        authStatusEl.textContent = "연구 에이전트 로그인 필요";
        authStatusEl.classList.add("auth-status--warn");
        loginToggleBtn.hidden = false;
        logoutBtn.hidden = true;
    }
}

function toggleLoginForm(forceOpen = false) {
    const shouldShow = forceOpen || loginForm.hidden;
    loginForm.hidden = !shouldShow;
    if (shouldShow) {
        passwordInput.focus();
    }
}

async function refreshAuthStatus() {
    if (isGitHubPages) {
        authState.authenticated = false;
        authState.apiAvailable = false;
        renderAuthStatus();
        return;
    }

    try {
        const response = await fetch("/auth/status", {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            throw new Error("status request failed");
        }

        const data = await response.json();
        authState.authenticated = Boolean(data.authenticated);
        authState.apiAvailable = true;
    } catch (_error) {
        authState.authenticated = false;
        authState.apiAvailable = false;
    }

    renderAuthStatus();
}

async function login(password) {
    loginSubmitBtn.disabled = true;
    setAuthMessage("인증 중...");

    try {
        const response = await fetch("/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify({ password })
        });

        if (!response.ok) {
            setAuthMessage("비밀번호가 올바르지 않습니다.", "error");
            return;
        }

        authState.authenticated = true;
        authState.apiAvailable = true;
        renderAuthStatus();
        loginForm.hidden = true;
        passwordInput.value = "";
        setAuthMessage("인증되었습니다.", "success");
    } catch (_error) {
        authState.apiAvailable = false;
        renderAuthStatus();
        setAuthMessage("인증 서버에 연결할 수 없습니다.", "error");
    } finally {
        loginSubmitBtn.disabled = false;
    }
}

async function logout() {
    try {
        await fetch("/auth/logout", {
            method: "POST",
            credentials: "include"
        });
    } catch (_error) {
        // ignore network errors and reset UI state
    }

    authState.authenticated = false;
    renderAuthStatus();
    setAuthMessage("로그아웃되었습니다.", "success");
}

function openAgent(agentId) {
    const agent = agents.find((item) => item.id === agentId);
    if (!agent) {
        return;
    }

    if (agent.requiresAuth) {
        if (!authState.apiAvailable) {
            if (agent.launchPath) {
                window.location.href = agent.launchPath;
                return;
            }
        }

        if (!authState.authenticated) {
            toggleLoginForm(true);
            setAuthMessage("Research Agent 이용을 위해 먼저 로그인하세요.", "error");
            return;
        }

        window.location.href = agent.protectedPath;
        return;
    }

    alert(`${agentId} 에이전트를 엽니다.`);
}

function createMetric(labelText, valueText) {
    const wrap = document.createElement("div");
    wrap.className = "metric";

    const label = document.createElement("span");
    label.className = "label";
    label.textContent = labelText;

    const value = document.createElement("span");
    value.className = "value";
    value.textContent = valueText;

    wrap.append(label, value);
    return wrap;
}

function addAgentCard(agent, index) {
    const dashboard = document.querySelector("#dashboard");
    const card = document.createElement("section");
    card.className = "agent-card";
    if (agent.highlight) {
        card.classList.add("agent-card--research");
    }
    card.style.animationDelay = `${index * 80}ms`;

    const head = document.createElement("div");
    head.className = "agent-card__head";

    const titleWrap = document.createElement("div");
    titleWrap.className = "agent-title";

    const icon = document.createElement("span");
    icon.className = "agent-icon";
    icon.textContent = agent.icon || "🤖";

    const title = document.createElement("h2");
    title.textContent = agent.name;

    titleWrap.append(icon, title);

    const badge = document.createElement("span");
    const state = statusMap[agent.status] || statusMap.offline;
    badge.className = `badge ${state.className}`;
    badge.textContent = state.label;

    head.append(titleWrap, badge);

    const desc = document.createElement("p");
    desc.textContent = agent.description;

    const meta = document.createElement("div");
    meta.className = "agent-meta";
    [
        `최근 실행: ${agent.lastRunDate || "-"}`,
        `최근 검색: ${agent.recentKeyword || "-"}`
    ].forEach((text) => {
        const chip = document.createElement("span");
        chip.className = "meta-chip";
        chip.textContent = text;
        meta.appendChild(chip);
    });

    const keywordRow = document.createElement("div");
    keywordRow.className = "keyword-row";
    (agent.keywords || []).forEach((keywordText) => {
        const keyword = document.createElement("span");
        keyword.className = "keyword";
        keyword.textContent = `#${keywordText}`;
        keywordRow.appendChild(keyword);
    });

    const metrics = document.createElement("div");
    metrics.className = "metrics";
    (agent.metrics || []).forEach((metric) => {
        metrics.append(createMetric(metric.label, metric.value));
    });

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = agent.buttonText || "열기";
    button.addEventListener("click", () => openAgent(agent.id));

    card.append(head, desc, meta, keywordRow, metrics, button);
    dashboard.appendChild(card);
}

function renderSummary() {
    const summary = document.querySelector("#summary");
    const onlineCount = agents.filter((agent) => agent.status === "online").length;
    const degradedCount = agents.filter((agent) => agent.status === "degraded").length;
    const offlineCount = agents.filter((agent) => agent.status === "offline").length;

    const items = [
        `총 ${agents.length}개 에이전트`,
        `Online ${onlineCount}`,
        `Degraded ${degradedCount}`,
        `Offline ${offlineCount}`
    ];

    items.forEach((text) => {
        const pill = document.createElement("span");
        pill.className = "pill";
        pill.textContent = text;
        summary.appendChild(pill);
    });
}

function bindAuthEvents() {
    loginToggleBtn.addEventListener("click", () => {
        toggleLoginForm();
        setAuthMessage("");
    });

    logoutBtn.addEventListener("click", async () => {
        await logout();
    });

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const password = passwordInput.value.trim();

        if (!password) {
            setAuthMessage("비밀번호를 입력하세요.", "error");
            return;
        }

        await login(password);
    });
}

function handleAuthRequiredHint() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("loginRequired") === "1") {
        toggleLoginForm(true);
        setAuthMessage("Research Agent 접근에는 인증이 필요합니다.", "error");

        params.delete("loginRequired");
        const nextQuery = params.toString();
        const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
        window.history.replaceState({}, "", nextUrl);
    }
}

renderSummary();
agents.forEach((agent, index) => addAgentCard(agent, index));
bindAuthEvents();
handleAuthRequiredHint();
refreshAuthStatus();
