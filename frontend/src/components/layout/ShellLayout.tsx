import { type LucideIcon, Bell, Search, Menu, LogOut } from "lucide-react"
import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

export interface ShellNavItem {
    label: string
    to: string
    icon: LucideIcon
    description?: string
}

interface ShellLayoutProps {
    userName?: string
    userPosition?: string
    avatarFallback?: string
    pageTitle?: string
    pageDescription?: string
    actions?: ReactNode
    navItems: ShellNavItem[]
    children: ReactNode
    onLogout?: () => void
    headerSlot?: ReactNode
}

export function ShellLayout({
    userName,
    userPosition,
    avatarFallback = "U",
    pageTitle,
    pageDescription,
    actions,
    navItems,
    children,
    onLogout,
    headerSlot,
}: ShellLayoutProps) {
    return (
        <div className="relative min-h-screen w-full bg-transparent text-foreground">
            <div className="mx-auto flex min-h-screen max-w-[1600px] rounded-[48px] bg-white/70 shadow-[0_55px_120px_rgba(15,23,42,0.18)] backdrop-blur-2xl">
                <aside className="hidden w-[260px] flex-col justify-between border-r border-white/30 bg-gradient-to-b from-[#101828] to-[#1f2937] p-6 text-white lg:flex">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-white/90">
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-xl font-semibold">YH</div>
                            <div>
                                <p className="text-sm uppercase tracking-[0.2em] text-white/60">Approval Hub</p>
                                <p className="text-lg font-semibold">审批系统</p>
                            </div>
                        </div>
                        <nav className="mt-10 space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    className={({ isActive }) =>
                                        cn(
                                            "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                                            isActive
                                                ? "bg-white text-[#0F172A] shadow-[0_12px_30px_rgba(15,23,42,0.25)]"
                                                : "text-white/70 hover:bg-white/10"
                                        )
                                    }
                                >
                                    <item.icon className="h-4 w-4" />
                                    <div className="flex flex-col">
                                        <span>{item.label}</span>
                                        {item.description && (
                                            <span className="text-xs text-white/40">{item.description}</span>
                                        )}
                                    </div>
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </aside>

                <div className="flex flex-1 flex-col">
                    <header className="sticky top-0 z-10 flex h-20 items-center border-b border-white/60 bg-white/70 px-6 backdrop-blur-2xl">
                        <div className="flex flex-1 items-center gap-3">
                            <button className="lg:hidden">
                                <Menu className="h-5 w-5 text-muted-foreground" />
                            </button>
                            <div className="relative hidden md:block">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    className="h-11 w-72 rounded-full border border-transparent bg-muted/50 pl-12 pr-4 text-sm text-muted-foreground outline-none transition focus:border-primary/30 focus:bg-white"
                                    placeholder="搜索申请、审批人或单号"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {actions}
                            <Button variant="ghost" size="icon" className="rounded-2xl">
                                <Bell className="h-5 w-5" />
                            </Button>
                            <div className="flex items-center gap-3 rounded-full border border-muted/40 bg-white px-4 py-1.5">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                    {avatarFallback}
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm font-semibold leading-tight">{userName || "未登录"}</p>
                                    <p className="text-xs text-muted-foreground">{userPosition || ""}</p>
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto px-6 py-10">
                        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                {pageTitle && (
                                    <h1 className="text-3xl font-semibold tracking-tight text-[#0F172A]">
                                        {pageTitle}
                                    </h1>
                                )}
                                {pageDescription && (
                                    <p className="mt-2 text-base text-muted-foreground max-w-2xl">
                                        {pageDescription}
                                    </p>
                                )}
                            </div>
                            {headerSlot}
                        </div>
                        {children}
                    </main>
                </div>
            </div>
            {userName && (
                <div className="pointer-events-auto fixed bottom-8 left-8 z-50 hidden max-w-[240px] flex-col rounded-3xl border border-white/20 bg-slate-900/90 p-5 text-white shadow-[0_25px_55px_rgba(8,12,30,0.35)] sm:flex">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">当前用户</p>
                    <p className="mt-3 text-xl font-semibold leading-tight">{userName}</p>
                    {userPosition && <p className="text-sm text-white/70">{userPosition}</p>}
                    {onLogout && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full justify-center rounded-full border-white/30 text-white hover:border-white/60 hover:bg-white/10"
                            onClick={onLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" /> 退出登录
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
