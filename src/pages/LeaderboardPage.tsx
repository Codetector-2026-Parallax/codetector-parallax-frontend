import { useEffect, useState, useMemo } from "react"
import { Link } from "@tanstack/react-router"
import {
  Trophy,
  Medal,
  Award,
  Radio,
  RefreshCw,
  Search,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
} from "lucide-react"
import logoImage from "../assets/logo.png"
import { useAuth } from "../context/useAuth"
import { getLeaderboard } from "../services/gameService"
import { wsService } from "../services/wsService"
import type { LeaderboardItem, LeaderboardResponse, WsLeaderboardUpdatedEvent } from "../types/game"

export default function LeaderboardPage() {
  const { team } = useAuth()
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isWsConnected, setIsWsConnected] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [recentNotification, setRecentNotification] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchLeaderboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true)
    try {
      const res = await getLeaderboard()
      setData(res)
      setLastUpdated(new Date())
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err)
    } finally {
      setLoading(false)
      if (isManual) setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLeaderboardData()

    // Setup WebSocket
    wsService.connect()
    setIsWsConnected(wsService.isConnected())

    const checkConnInterval = setInterval(() => {
      setIsWsConnected(wsService.isConnected())
    }, 2000)

    const unsubscribe = wsService.subscribe((event) => {
      const maybeEvent = event as Partial<WsLeaderboardUpdatedEvent>
      if (maybeEvent.event === "LEADERBOARD_UPDATED" && maybeEvent.team_name) {
        setRecentNotification(
          `⚡ Đội "${maybeEvent.team_name}" vừa hoàn thành Chặng ${maybeEvent.stage_number}!`
        )
        fetchLeaderboardData()
      }
    })

    // Fallback polling every 20s
    const pollInterval = setInterval(() => {
      fetchLeaderboardData()
    }, 20000)

    return () => {
      clearInterval(checkConnInterval)
      clearInterval(pollInterval)
      unsubscribe()
    }
  }, [])

  // Auto hide notification banner after 6s
  useEffect(() => {
    if (recentNotification) {
      const timer = setTimeout(() => {
        setRecentNotification(null)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [recentNotification])

  const filteredTeams = useMemo(() => {
    if (!data?.leaderboard) return []
    if (!searchQuery.trim()) return data.leaderboard

    const q = searchQuery.toLowerCase().trim()
    return data.leaderboard.filter(
      (item) =>
        item.team_name.toLowerCase().includes(q) ||
        item.username.toLowerCase().includes(q)
    )
  }, [data, searchQuery])

  const top3 = useMemo(() => {
    if (!data?.leaderboard) return []
    return data.leaderboard.slice(0, 3)
  }, [data])

  const stats = useMemo(() => {
    if (!data?.leaderboard) return { total: 0, completed2: 0, completed1: 0 }
    return {
      total: data.leaderboard.length,
      completed2: data.leaderboard.filter((t) => t.completed_stages_count === 2).length,
      completed1: data.leaderboard.filter((t) => t.completed_stages_count === 1).length,
    }
  }, [data])

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return "—"
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch {
      return ts
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground pb-20 selection:bg-primary/30">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
            >
              <img src={logoImage} alt="Logo" className="size-8 object-contain" />
              <div className="flex flex-col">
                <span className="font-display text-sm font-bold tracking-[0.16em] text-primary sm:text-base">
                  CØDETECTOR 2026
                </span>
                <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase">
                  PARALLAX LEADERBOARD
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {/* Live WS Status */}
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isWsConnected
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400"
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isWsConnected ? "animate-pulse bg-emerald-400" : "bg-amber-400"
                }`}
              />
              <Radio className="size-3.5" />
              <span className="hidden sm:inline">
                {isWsConnected ? "REALTIME LIVE" : "KẾT NỐI LẠI..."}
              </span>
            </div>

            {/* Manual Refresh */}
            <button
              type="button"
              onClick={() => fetchLeaderboardData(true)}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-secondary/30 px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-secondary/60 disabled:opacity-50"
              title="Làm mới bảng xếp hạng"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>

            {/* Back to workspace / home */}
            {team ? (
              <Link
                to="/game"
                className="flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/25"
              >
                <ArrowLeft className="size-3.5" />
                <span>Bàn phá án</span>
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 rounded-lg border border-primary/50 bg-primary/15 px-3 py-1.5 text-xs font-semibold text-primary transition-all hover:bg-primary/25"
              >
                <span>Đăng nhập</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Realtime Alert Banner */}
        {recentNotification && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-primary/50 bg-primary/10 p-4 text-sm text-primary shadow-[0_0_20px_rgba(202,138,4,0.15)] animate-in fade-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <Zap className="size-4 animate-pulse" />
              </span>
              <p className="font-medium tracking-wide">{recentNotification}</p>
            </div>
            <button
              onClick={() => setRecentNotification(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        )}

        {/* Title & Overview */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 border-b border-border/70 pb-6 md:flex-row md:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase mb-2">
              <Trophy className="size-3.5 text-primary" />
              BẢNG XẾP HẠNG TOÀN CUỘC (2 CHẶNG)
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              CUỘC ĐUA PHÁ ÁN REALTIME
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Cập nhật trực tiếp kết quả giải mã giữa các đội tham gia chuyên án Parallax qua 2 chặng thi đấu.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>
                Cập nhật lần cuối: {lastUpdated.toLocaleTimeString("vi-VN")}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-xl border border-border/70 bg-card/50 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase">Tổng số đội</p>
            <p className="mt-1 font-mono text-2xl font-bold text-foreground">{stats.total}</p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-emerald-400 uppercase">Hoàn thành cả 2 chặng</p>
              <Sparkles className="size-4 text-emerald-400" />
            </div>
            <p className="mt-1 font-mono text-2xl font-bold text-emerald-400">{stats.completed2}</p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-amber-400 uppercase">Hoàn thành 1 chặng</p>
              <CheckCircle2 className="size-4 text-amber-400" />
            </div>
            <p className="mt-1 font-mono text-2xl font-bold text-amber-400">{stats.completed1}</p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 backdrop-blur-sm">
            <p className="text-xs font-medium text-primary uppercase">Tổng quy mô chặng</p>
            <p className="mt-1 font-mono text-2xl font-bold text-primary">2 Chặng</p>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="mb-10">
            <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              TOP ĐỘI DẪN ĐẦU CHUYÊN ÁN
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Rank 2 (Silver) */}
              <div
                className={`order-2 md:order-1 rounded-2xl border p-5 backdrop-blur-md transition-all ${
                  top3[1]
                    ? "border-slate-400/40 bg-gradient-to-b from-slate-400/10 via-card/50 to-card/90 shadow-[0_4px_20px_rgba(148,163,184,0.1)]"
                    : "border-border/40 bg-card/30 opacity-40"
                }`}
              >
                {top3[1] ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3 flex size-14 items-center justify-center rounded-2xl border border-slate-300/40 bg-slate-300/15 text-slate-300 shadow-md">
                      <Medal className="size-7" />
                      <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-slate-900">
                        2
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-400 uppercase">Á QUÂN #2</span>
                    <h3 className="mt-1 font-display text-lg font-bold text-foreground truncate max-w-full">
                      {top3[1].team_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">@{top3[1].username}</p>

                    <div className="mt-4 flex w-full flex-col gap-2 rounded-lg border border-border/60 bg-background/50 p-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tiến độ:</span>
                        <span className="font-mono font-bold text-slate-300">
                          {top3[1].completed_stages_count}/2 chặng
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Thời gian:</span>
                        <span className="font-mono text-slate-300">
                          {formatTimestamp(top3[1].last_completed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">Đang chờ cập nhật...</div>
                )}
              </div>

              {/* Rank 1 (Gold) */}
              <div
                className={`order-1 md:order-2 rounded-2xl border p-6 backdrop-blur-md transition-all relative overflow-hidden ${
                  top3[0]
                    ? "border-amber-400/60 bg-gradient-to-b from-amber-400/15 via-card/60 to-card/95 shadow-[0_0_30px_rgba(251,191,36,0.18)] ring-1 ring-amber-400/40 -translate-y-1"
                    : "border-border/40 bg-card/30 opacity-40"
                }`}
              >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 size-36 bg-amber-400/20 blur-3xl rounded-full pointer-events-none" />
                {top3[0] ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3 flex size-16 items-center justify-center rounded-2xl border border-amber-400/60 bg-amber-400/20 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                      <Trophy className="size-8" />
                      <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-black shadow-sm">
                        1
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-amber-400 tracking-wider uppercase">
                      QUÁN QUÂN #1
                    </span>
                    <h3 className="mt-1 font-display text-xl font-bold text-foreground truncate max-w-full">
                      {top3[0].team_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">@{top3[0].username}</p>

                    <div className="mt-4 flex w-full flex-col gap-2 rounded-lg border border-amber-400/30 bg-amber-950/20 p-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-amber-200/70">Tiến độ phá án:</span>
                        <span className="font-mono font-bold text-amber-400">
                          {top3[0].completed_stages_count}/2 chặng
                          {top3[0].is_finished && " (HOÀN TẤT)"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-amber-200/70">Cán đích lúc:</span>
                        <span className="font-mono text-amber-300">
                          {formatTimestamp(top3[0].last_completed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">Đang chờ cập nhật...</div>
                )}
              </div>

              {/* Rank 3 (Bronze) */}
              <div
                className={`order-3 rounded-2xl border p-5 backdrop-blur-md transition-all ${
                  top3[2]
                    ? "border-amber-700/40 bg-gradient-to-b from-amber-700/10 via-card/50 to-card/90 shadow-[0_4px_20px_rgba(180,83,9,0.1)]"
                    : "border-border/40 bg-card/30 opacity-40"
                }`}
              >
                {top3[2] ? (
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3 flex size-14 items-center justify-center rounded-2xl border border-amber-600/40 bg-amber-600/15 text-amber-500 shadow-md">
                      <Award className="size-7" />
                      <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                        3
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-amber-500 uppercase">HẠNG BA #3</span>
                    <h3 className="mt-1 font-display text-lg font-bold text-foreground truncate max-w-full">
                      {top3[2].team_name}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono">@{top3[2].username}</p>

                    <div className="mt-4 flex w-full flex-col gap-2 rounded-lg border border-border/60 bg-background/50 p-3 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Tiến độ:</span>
                        <span className="font-mono font-bold text-amber-400">
                          {top3[2].completed_stages_count}/2 chặng
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Thời gian:</span>
                        <span className="font-mono text-amber-400">
                          {formatTimestamp(top3[2].last_completed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-muted-foreground">Đang chờ cập nhật...</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter and Table Controls */}
        <div className="mb-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên đội hoặc username..."
              className="w-full rounded-xl border border-border/80 bg-card/60 pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary backdrop-blur-sm"
            />
          </div>

          <div className="text-xs text-muted-foreground font-mono">
            Hiển thị <span className="font-bold text-foreground">{filteredTeams.length}</span> đội thi
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/50 backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border/80 bg-secondary/30 font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 pl-6 pr-3 text-center w-16">Hạng</th>
                  <th className="py-3.5 px-4 min-w-[200px]">Đội thi</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Chặng 1 (Bảo tàng)</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Chặng 2 (Tẩu thoát)</th>
                  <th className="py-3.5 px-4 text-center min-w-[130px]">Tiến độ</th>
                  <th className="py-3.5 pr-6 pl-4 text-right min-w-[140px]">Cán đích</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="mx-auto size-6 animate-spin text-primary mb-2" />
                      Đang tải bảng xếp hạng...
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      Không tìm thấy đội thi nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((item: LeaderboardItem) => {
                    const isCurrentTeam = team && team.id === item.team_id

                    return (
                      <tr
                        key={item.team_id}
                        className={`transition-colors hover:bg-secondary/20 ${
                          isCurrentTeam
                            ? "bg-primary/10 border-l-4 border-l-primary"
                            : ""
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 pl-6 pr-3 text-center">
                          {item.rank === 1 ? (
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-amber-400 text-xs font-bold text-black shadow-sm">
                              1
                            </span>
                          ) : item.rank === 2 ? (
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-slate-300 text-xs font-bold text-slate-900 shadow-sm">
                              2
                            </span>
                          ) : item.rank === 3 ? (
                            <span className="inline-flex size-7 items-center justify-center rounded-lg bg-amber-600 text-xs font-bold text-white shadow-sm">
                              3
                            </span>
                          ) : (
                            <span className="font-mono text-muted-foreground font-semibold">
                              #{item.rank}
                            </span>
                          )}
                        </td>

                        {/* Team name */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground text-sm">
                              {item.team_name}
                            </span>
                            {isCurrentTeam && (
                              <span className="rounded-md border border-primary/50 bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary uppercase">
                                Đội của bạn
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground">
                            @{item.username}
                          </span>
                        </td>

                        {/* Stage 1 status */}
                        <td className="py-4 px-4">
                          {item.stage_1_completed_at ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                Đã giải mã
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {formatTimestamp(item.stage_1_completed_at)}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-muted-foreground/70">
                              <Clock className="size-3.5" />
                              Đang điều tra
                            </span>
                          )}
                        </td>

                        {/* Stage 2 status */}
                        <td className="py-4 px-4">
                          {item.stage_2_completed_at ? (
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                                <CheckCircle2 className="size-3.5" />
                                Đã tóm gọn
                              </span>
                              <span className="font-mono text-[10px] text-muted-foreground">
                                {formatTimestamp(item.stage_2_completed_at)}
                              </span>
                            </div>
                          ) : item.completed_stages_count >= 1 ? (
                            <span className="inline-flex items-center gap-1 text-amber-400/90 font-medium">
                              <Clock className="size-3.5 animate-pulse" />
                              Đang truy bắt
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">— Chưa mở</span>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-1 w-24">
                            <span className="font-mono font-bold text-xs">
                              {item.completed_stages_count}/2
                            </span>
                            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                              <div
                                className={`h-full transition-all duration-500 ${
                                  item.completed_stages_count === 2
                                    ? "bg-emerald-400 w-full"
                                    : item.completed_stages_count === 1
                                    ? "bg-amber-400 w-1/2"
                                    : "bg-transparent w-0"
                                }`}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Last completed time */}
                        <td className="py-4 pr-6 pl-4 text-right font-mono text-xs">
                          {item.last_completed_at ? (
                            <span className="text-foreground">
                              {formatTimestamp(item.last_completed_at)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
