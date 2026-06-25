import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3, CheckCircle2, Clock, ExternalLink, FileText, LogIn, RefreshCw, Search } from "lucide-react";
import type { ScanRun, ScoredNote } from "../shared/types";
import { cleanNoteDisplayText } from "../shared/textCleanup";

const API_BASE = "http://127.0.0.1:8787";

const emptyRun: ScanRun = {
  runId: "empty",
  date: "",
  generatedAt: "",
  keywords: [],
  notes: [],
  insights: [],
  errors: []
};

function formatMetric(value: number | undefined, fallback: string) {
  if (value === undefined) return fallback;
  if (value >= 10_000) return `${(value / 10_000).toFixed(1)}万`;
  return String(value);
}

function formatScore(value: number) {
  return Math.round(value).toString();
}

function statusLabel(note: ScoredNote) {
  if (note.status === "strong_hit") return "强爆款";
  if (note.status === "watch") return "观察";
  return "标题参考";
}

function sourceLabel(note: ScoredNote) {
  if (note.source === "logged-in-browser") return "登录采集";
  return note.source === "public-browser" ? "公开页面" : note.source === "search-fallback" ? "搜索兜底" : "演示";
}

function apiErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("Load failed")) {
    return "本机采集服务未连接。请在当前电脑的项目目录运行 npm run api，再回到页面点击登录或扫描。";
  }
  return `操作失败：${message}`;
}

export function App() {
  const [run, setRun] = useState<ScanRun>(emptyRun);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [keywordDraft, setKeywordDraft] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isOpeningLogin, setIsOpeningLogin] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  async function loadRun() {
    const response = await fetch(`./latest-run.json?ts=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as ScanRun;
    setRun(data);
    setSelectedKeyword(data.keywords[0] ?? "all");
    setKeywordDraft(data.keywords.join("、"));
  }

  useEffect(() => {
    loadRun()
      .catch((error) => setLoadError(error instanceof Error ? error.message : String(error)));
  }, []);

  const draftKeywords = useMemo(() => {
    return keywordDraft
      .split(/[,，、\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter((item, index, array) => array.indexOf(item) === index)
      .slice(0, 5);
  }, [keywordDraft]);

  async function runScanFromWeb() {
    setIsScanning(true);
    setActionMessage("");
    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keywords: draftKeywords })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      setRun(payload as ScanRun);
      setSelectedKeyword((payload as ScanRun).keywords[0] ?? "all");
      setActionMessage("扫描完成，已刷新看板和 Markdown 日报。");
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setIsScanning(false);
    }
  }

  async function openLoginWindow() {
    setIsOpeningLogin(true);
    setActionMessage("");
    setActionError("");
    try {
      const response = await fetch(`${API_BASE}/api/login/open`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? `HTTP ${response.status}`);
      setActionMessage(payload.message ?? "登录窗口已打开。登录完成后点击立即扫描。");
    } catch (error) {
      setActionError(apiErrorMessage(error));
    } finally {
      setIsOpeningLogin(false);
    }
  }

  const filteredNotes = useMemo(() => {
    return run.notes.filter((note) => {
      const keywordMatch = selectedKeyword === "all" || note.keyword === selectedKeyword;
      const queryMatch = query.trim().length === 0 || `${note.title} ${note.summary} ${note.topics.join(" ")}`.includes(query.trim());
      return keywordMatch && queryMatch;
    });
  }, [query, run.notes, selectedKeyword]);

  const selectedInsight = run.insights.find((insight) => insight.keyword === selectedKeyword) ?? run.insights[0];
  const strongCount = run.notes.filter((note) => note.status === "strong_hit").length;
  const referenceCount = run.notes.filter((note) => note.status === "reference_only").length;

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">爆</div>
          <div>
            <h1>小红书爆款雷达</h1>
            <p>轻量公开采集版</p>
          </div>
        </div>

        <nav className="keyword-list" aria-label="关键词">
          <button className={selectedKeyword === "all" ? "active" : ""} onClick={() => setSelectedKeyword("all")}>
            全部关键词
            <span>{run.notes.length}</span>
          </button>
          {run.keywords.map((keyword) => (
            <button className={selectedKeyword === keyword ? "active" : ""} key={keyword} onClick={() => setSelectedKeyword(keyword)}>
              {keyword}
              <span>{run.notes.filter((note) => note.keyword === keyword).length}</span>
            </button>
          ))}
        </nav>

        <div className="run-card">
          <div className="run-row">
            <Clock size={16} />
            <span>{run.generatedAt ? new Date(run.generatedAt).toLocaleString("zh-CN") : "尚未扫描"}</span>
          </div>
          <div className="run-row">
            <FileText size={16} />
            <a href="./latest-report.md" target="_blank" rel="noreferrer">
              查看 Markdown 日报
            </a>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <h2>今日爆款判断</h2>
            <p>输入 1-5 个关键词，直接在网页里扫描、刷新看板和日报。</p>
          </div>
          <div className="actions">
            <label className="search-box">
              <Search size={16} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛标题、话题、摘要" />
            </label>
            <button className="primary-button" onClick={() => window.location.reload()}>
              <RefreshCw size={16} />
              刷新
            </button>
          </div>
        </header>

        <section className="scan-panel">
          <div>
            <label htmlFor="keywords">监控关键词</label>
            <input
              id="keywords"
              value={keywordDraft}
              onChange={(event) => setKeywordDraft(event.target.value)}
              placeholder="护肤、家居收纳、职场穿搭"
            />
            <p>精准模式已开启：会打开笔记详情页提取真实 #话题，用逗号、顿号或换行分隔，最多 5 个。</p>
          </div>
          <button className="secondary-button" disabled={isOpeningLogin} onClick={openLoginWindow}>
            <LogIn size={17} />
            {isOpeningLogin ? "打开中..." : "打开登录窗口"}
          </button>
          <button className="scan-button" disabled={isScanning || draftKeywords.length === 0} onClick={runScanFromWeb}>
            <RefreshCw size={17} className={isScanning ? "spinning" : ""} />
            {isScanning ? "扫描中..." : "立即扫描"}
          </button>
        </section>

        <div className="stats-row">
          <div className="stat">
            <BarChart3 size={18} />
            <div>
              <strong>{run.notes.length}</strong>
              <span>候选内容</span>
            </div>
          </div>
          <div className="stat">
            <CheckCircle2 size={18} />
            <div>
              <strong>{strongCount}</strong>
              <span>强爆款</span>
            </div>
          </div>
          <div className="stat">
            <AlertCircle size={18} />
            <div>
              <strong>{referenceCount}</strong>
              <span>仅供参考</span>
            </div>
          </div>
        </div>

        {loadError && <div className="notice">看板数据读取失败：{loadError}</div>}
        {actionError && <div className="notice">{actionError}</div>}
        {actionMessage && <div className="success-notice">{actionMessage}</div>}
        {run.errors.length > 0 && <div className="notice">{run.errors.join("；")}</div>}

        <div className="content-grid">
          <section className="table-panel">
            <div className="table-head">
              <span>排名</span>
              <span>标题与话题</span>
              <span>互动</span>
              <span>评分</span>
            </div>
            <div className="table-body">
              {filteredNotes.length === 0 ? (
                <div className="empty-state">暂无结果。先运行 npm run scan，或换一个关键词。</div>
              ) : (
                filteredNotes.map((note, index) => (
                  <article className="note-row" key={note.id}>
                    <div className="rank">{index + 1}</div>
                    <div className="note-main">
                      <a href={note.url} target="_blank" rel="noreferrer">
                        {cleanNoteDisplayText(note.title)}
                        <ExternalLink size={14} />
                      </a>
                      <p>{cleanNoteDisplayText(note.summary) || "无摘要"}</p>
                      <div className="topic-line">
                        {note.topics.map((topic) => (
                          <span key={topic}>#{topic}</span>
                        ))}
                        <span className={`status ${note.status}`}>{statusLabel(note)}</span>
                        <em>{sourceLabel(note)}</em>
                      </div>
                    </div>
                    <div className="metrics" aria-label="互动数据">
                      <span>赞 <strong>{formatMetric(note.metrics.likes, "登录后显示")}</strong></span>
                      <span>藏 <strong>{formatMetric(note.metrics.collects, "未公开")}</strong></span>
                      <span>评 <strong>{formatMetric(note.metrics.comments, "未公开")}</strong></span>
                    </div>
                    <div className="score">{formatScore(note.score)}</div>
                  </article>
                ))
              )}
            </div>
          </section>

          <aside className="insight-panel">
            <h3>今日结论</h3>
            {selectedInsight ? (
              <>
                <div className="direction">{selectedInsight.direction}</div>
                <p>{selectedInsight.rationale}</p>
                <h4>可参考标题</h4>
                <ul>
                  {selectedInsight.titlePatterns.map((title) => (
                    <li key={title}>{title}</li>
                  ))}
                </ul>
                <h4>高频话题</h4>
                <div className="topic-cloud">
                  {selectedInsight.topics.map((topic) => (
                    <span key={topic}>#{topic}</span>
                  ))}
                </div>
              </>
            ) : (
              <p>暂无洞察。运行扫描后会在这里生成方向判断。</p>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
