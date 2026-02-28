const MONITOR_SOURCE_URL = "./monitoring/research-agent-status.json";
const MONITOR_INTERVAL_MS = 60 * 1000;

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
        launchPath: "https://ldgit99.github.io/rss-agent/",
        buttonText: "열기",
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
        buttonText: "열기",
        highlight: true,
        metrics: [
            { label: "최근 실행", value: "2026-02-28 11:34" },
            { label: "오늘 분석", value: "18편" },
            { label: "일일 보고서", value: "6건" },
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
    },
    {
        id: "monitor",
        icon: "🛰️",
        name: "Monitoring Agent",
        description: "Research Agent 상태를 점검하고 핵심 운영 지표를 대시보드에 반영합니다.",
        status: "online",
        lastRunDate: "-",
        recentKeyword: "-",
        keywords: ["health-check", "telemetry", "dashboard"],
        buttonText: "새로고침",
        metrics: [
            { label: "최근 점검", value: "-" },
            { label: "데이터 지연", value: "-" },
            { label: "점검 항목", value: "5개" },
            { label: "동기화 상태", value: "대기" }
        ]
    }
];

const statusMap = {
    online:   { label: "Online",   className: "ok" },
    degraded: { label: "Degraded", className: "warn" },
    offline:  { label: "Offline",  className: "down" }
};

const monitorState = {
    lastCheckedAt: "-",
    delayText: "-",
    syncStatus: "대기"
};

// DOM 참조 (DOMContentLoaded 후 설정)
let refreshBtn;
let lastUpdatedEl;

/* ── 유틸 ── */
function formatDateTime(input) {
    if (!input) return "-";
    const date = new Date(input);
    if (Number.isNaN(date.getTime())) return "-";

    const yyyy = date.getFullYear();
    const mm   = String(date.getMonth() + 1).padStart(2, "0");
    const dd   = String(date.getDate()).padStart(2, "0");
    const hh   = String(date.getHours()).padStart(2, "0");
    const mi   = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function findAgent(id) {
    return agents.find((agent) => agent.id === id);
}

/* ── 에이전트 열기 ── */
function openAgent(agentId) {
    if (agentId === "monitor") {
        runMonitoringCycle();
        return;
    }

    const agent = findAgent(agentId);
    if (!agent || !agent.launchPath) return;

    window.open(agent.launchPath, "_blank", "noopener,noreferrer");
}

/* ── 메트릭 셀 생성 ── */
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

/* ── 스켈레톤 카드 렌더링 ── */
function renderSkeleton() {
    const dashboard = document.querySelector("#dashboard");
    dashboard.innerHTML = "";

    for (let i = 0; i < agents.length; i++) {
        const card = document.createElement("div");
        card.className = "skeleton-card";
        card.style.animationDelay = `${i * 80}ms`;

        card.innerHTML = `
            <div class="skeleton-head">
                <div style="display:flex;align-items:center;gap:0.55rem;flex:1;min-width:0;">
                    <div class="skeleton-line" style="width:32px;height:32px;border-radius:10px;flex-shrink:0;"></div>
                    <div class="skeleton-line" style="height:18px;width:55%;border-radius:8px;"></div>
                </div>
                <div class="skeleton-line" style="width:60px;height:22px;border-radius:999px;flex-shrink:0;"></div>
            </div>
            <div style="display:flex;flex-direction:column;gap:0.4rem;">
                <div class="skeleton-line" style="height:13px;border-radius:5px;"></div>
                <div class="skeleton-line" style="height:13px;width:75%;border-radius:5px;"></div>
            </div>
            <div class="skeleton-meta">
                <div class="skeleton-line" style="height:26px;width:38%;border-radius:999px;"></div>
                <div class="skeleton-line" style="height:26px;width:38%;border-radius:999px;"></div>
            </div>
            <div class="skeleton-meta">
                <div class="skeleton-line" style="height:22px;width:22%;border-radius:999px;"></div>
                <div class="skeleton-line" style="height:22px;width:22%;border-radius:999px;"></div>
                <div class="skeleton-line" style="height:22px;width:22%;border-radius:999px;"></div>
            </div>
            <div class="skeleton-metrics">
                <div class="skeleton-line" style="height:54px;border-radius:10px;"></div>
                <div class="skeleton-line" style="height:54px;border-radius:10px;"></div>
                <div class="skeleton-line" style="height:54px;border-radius:10px;"></div>
                <div class="skeleton-line" style="height:54px;border-radius:10px;"></div>
            </div>
        `;

        dashboard.appendChild(card);
    }
}

/* ── 에이전트 카드 렌더링 ── */
function addAgentCard(agent, index) {
    const dashboard = document.querySelector("#dashboard");
    const card = document.createElement("section");

    card.className = "agent-card";
    if (agent.highlight) card.classList.add("agent-card--research");
    card.classList.add(`agent-card--${agent.status}`);
    card.style.animationDelay = `${index * 80}ms`;

    // 헤더
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

    // 설명
    const desc = document.createElement("p");
    desc.textContent = agent.description;

    // 메타 칩
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

    // 키워드
    const keywordRow = document.createElement("div");
    keywordRow.className = "keyword-row";
    (agent.keywords || []).forEach((keywordText) => {
        const keyword = document.createElement("span");
        keyword.className = "keyword";
        keyword.textContent = `#${keywordText}`;
        keywordRow.appendChild(keyword);
    });

    // 메트릭
    const metrics = document.createElement("div");
    metrics.className = "metrics";
    (agent.metrics || []).forEach((metric) => {
        metrics.append(createMetric(metric.label, metric.value));
    });

    card.append(head, desc, meta, keywordRow, metrics);

    // 버튼 — launchPath 있거나 monitor인 경우만 표시
    if (agent.launchPath || agent.id === "monitor") {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = agent.buttonText || "열기";
        button.addEventListener("click", () => openAgent(agent.id));
        card.append(button);
    }

    dashboard.appendChild(card);
}

/* ── Summary pills ── */
function renderSummary() {
    const summary = document.querySelector("#summary");
    summary.innerHTML = "";

    const onlineCount  = agents.filter((a) => a.status === "online").length;
    const degradedCount = agents.filter((a) => a.status === "degraded").length;
    const offlineCount = agents.filter((a) => a.status === "offline").length;

    const items = [
        { text: `총 ${agents.length}개 에이전트`, cls: "" },
        { text: `Online ${onlineCount}`,   cls: onlineCount  > 0 ? "pill--ok"   : "" },
        { text: `Degraded ${degradedCount}`, cls: degradedCount > 0 ? "pill--warn" : "" },
        { text: `Offline ${offlineCount}`, cls: offlineCount > 0 ? "pill--down" : "" }
    ];

    items.forEach(({ text, cls }) => {
        const pill = document.createElement("span");
        pill.className = `pill${cls ? ` ${cls}` : ""}`;
        pill.textContent = text;
        summary.appendChild(pill);
    });
}

/* ── 대시보드 렌더링 ── */
function renderDashboard() {
    const dashboard = document.querySelector("#dashboard");
    dashboard.innerHTML = "";
    agents.forEach((agent, index) => addAgentCard(agent, index));
    renderSummary();
}

/* ── 마지막 갱신 시각 업데이트 ── */
function updateLastUpdated() {
    if (!lastUpdatedEl) return;
    const now = new Date();
    const hh  = String(now.getHours()).padStart(2, "0");
    const mi  = String(now.getMinutes()).padStart(2, "0");
    lastUpdatedEl.textContent = `${hh}:${mi} 갱신`;
}

/* ── 새로고침 버튼 스피너 ── */
function setRefreshing(spinning) {
    if (!refreshBtn) return;
    refreshBtn.disabled = spinning;
    refreshBtn.classList.toggle("spinning", spinning);
}

/* ── 모니터링 데이터 처리 ── */
function getDelayMinutes(updatedAt) {
    const target = new Date(updatedAt);
    if (Number.isNaN(target.getTime())) return null;
    return Math.max(0, Math.floor((Date.now() - target.getTime()) / 60000));
}

function applyResearchSnapshot(snapshot) {
    const researchAgent   = findAgent("summarizer");
    const monitoringAgent = findAgent("monitor");
    if (!researchAgent || !monitoringAgent) return;

    const delayMinutes = getDelayMinutes(snapshot.updatedAt);
    let monitorStatus = "online";
    let delayText = "-";

    if (delayMinutes === null) {
        monitorStatus = "degraded";
        delayText = "알 수 없음";
    } else {
        delayText = `${delayMinutes}분`;
        if (delayMinutes > 30)      monitorStatus = "offline";
        else if (delayMinutes > 10) monitorStatus = "degraded";
    }

    const lastRunText   = formatDateTime(snapshot.lastRunAt);
    const keywordText   = snapshot.recentKeyword || "-";
    const todayAnalyzed = Number.isFinite(snapshot.todayAnalyzed) ? `${snapshot.todayAnalyzed}편` : "-";
    const dailyReports  = Number.isFinite(snapshot.dailyReports)  ? `${snapshot.dailyReports}건`  : "-";
    const syncText      = snapshot.syncTarget
        ? `${snapshot.syncTarget} (${snapshot.syncStatus || "상태 미확인"})`
        : "-";

    researchAgent.lastRunDate    = lastRunText;
    researchAgent.recentKeyword  = keywordText;
    researchAgent.keywords       = Array.isArray(snapshot.keywords) && snapshot.keywords.length > 0
        ? snapshot.keywords
        : researchAgent.keywords;
    researchAgent.status  = monitorStatus === "offline" ? "degraded" : "online";
    researchAgent.metrics = [
        { label: "최근 실행",   value: lastRunText },
        { label: "오늘 분석",   value: todayAnalyzed },
        { label: "일일 보고서", value: dailyReports },
        { label: "동기화",      value: syncText }
    ];

    monitorState.lastCheckedAt = formatDateTime(snapshot.updatedAt);
    monitorState.delayText     = delayText;
    monitorState.syncStatus    = snapshot.syncStatus || "상태 미확인";

    monitoringAgent.status        = monitorStatus;
    monitoringAgent.lastRunDate   = monitorState.lastCheckedAt;
    monitoringAgent.recentKeyword = keywordText;
    monitoringAgent.metrics = [
        { label: "최근 점검",   value: monitorState.lastCheckedAt },
        { label: "데이터 지연", value: monitorState.delayText },
        { label: "점검 항목",   value: "5개" },
        { label: "동기화 상태", value: monitorState.syncStatus }
    ];
}

function applyMonitoringFailure() {
    const monitoringAgent = findAgent("monitor");
    if (!monitoringAgent) return;

    monitoringAgent.status        = "offline";
    monitoringAgent.lastRunDate   = formatDateTime(new Date().toISOString());
    monitoringAgent.recentKeyword = "데이터 수집 실패";
    monitoringAgent.metrics = [
        { label: "최근 점검",   value: monitoringAgent.lastRunDate },
        { label: "데이터 지연", value: "수집 실패" },
        { label: "점검 항목",   value: "5개" },
        { label: "동기화 상태", value: "확인 불가" }
    ];
}

/* ── 모니터링 사이클 ── */
async function runMonitoringCycle() {
    try {
        const response = await fetch(`${MONITOR_SOURCE_URL}?t=${Date.now()}`, { cache: "no-store" });
        if (!response.ok) throw new Error("monitor source unavailable");
        const snapshot = await response.json();
        applyResearchSnapshot(snapshot);
    } catch (_error) {
        applyMonitoringFailure();
    }

    renderDashboard();
    updateLastUpdated();
}

/* ── 초기화 ── */
document.addEventListener("DOMContentLoaded", () => {
    refreshBtn    = document.getElementById("refresh-btn");
    lastUpdatedEl = document.getElementById("last-updated");

    // 전역 새로고침 버튼
    refreshBtn.addEventListener("click", async () => {
        setRefreshing(true);
        await runMonitoringCycle();
        setRefreshing(false);
    });

    // 스켈레톤 먼저 표시 → 데이터 로드 후 실제 카드로 교체
    renderSkeleton();
    runMonitoringCycle();
    setInterval(runMonitoringCycle, MONITOR_INTERVAL_MS);
});
