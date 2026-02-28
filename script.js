const agents = [
    {
        id: "collector",
        name: "Daily Paper Digest",
        description: "외부 피드 수집과 중복 제거를 담당합니다.",
        status: "online",
        lastRun: "2분 전",
        successRate: 98,
        queue: 3
    },
    {
        id: "summarizer",
        name: "Research Agent",
        description: "arXiv/웹 논문을 탐색하고 핵심 기여, 한계, 후속 연구 아이디어를 요약합니다.",
        status: "online",
        lastRun: "방금 전",
        successRate: 96,
        queue: 4,
        launchPath: "https://research-agent-ldgit99.streamlit.app/",
        buttonText: "연구 열기",
        metrics: [
            { label: "오늘 분석", value: "18편" },
            { label: "핵심 분야", value: "LLM Eval" },
            { label: "최근 키워드", value: "RAG" },
            { label: "업데이트", value: "실시간" }
        ]
    },
    {
        id: "publisher",
        name: "Report Publisher",
        description: "검수된 리포트를 사내 채널로 배포합니다.",
        status: "offline",
        lastRun: "1시간 전",
        successRate: 0,
        queue: 0
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

function getAgentMetrics(agent) {
    if (Array.isArray(agent.metrics) && agent.metrics.length > 0) {
        return agent.metrics;
    }

    return [
        { label: "최근 실행", value: agent.lastRun },
        { label: "성공률", value: `${agent.successRate}%` },
        { label: "대기 작업", value: `${agent.queue}건` },
        { label: "ID", value: agent.id }
    ];
}

function addAgentCard(agent, index) {
    const dashboard = document.querySelector("#dashboard");
    const card = document.createElement("section");
    card.className = "agent-card";
    card.style.animationDelay = `${index * 80}ms`;

    const head = document.createElement("div");
    head.className = "agent-card__head";

    const title = document.createElement("h2");
    title.textContent = agent.name;

    const badge = document.createElement("span");
    const state = statusMap[agent.status] || statusMap.offline;
    badge.className = `badge ${state.className}`;
    badge.textContent = state.label;

    head.append(title, badge);

    const desc = document.createElement("p");
    desc.textContent = agent.description;

    const metrics = document.createElement("div");
    metrics.className = "metrics";
    getAgentMetrics(agent).forEach((metric) => {
        metrics.append(createMetric(metric.label, metric.value));
    });

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = agent.buttonText || "열기";
    button.addEventListener("click", () => openAgent(agent.id));

    card.append(head, desc, metrics, button);
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
