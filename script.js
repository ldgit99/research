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

function openAgent(agentId) {
    const agent = agents.find((item) => item.id === agentId);
    if (agent && agent.launchPath) {
        window.location.href = agent.launchPath;
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

renderSummary();
agents.forEach((agent, index) => addAgentCard(agent, index));
