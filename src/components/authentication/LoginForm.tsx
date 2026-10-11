import { useEffect, useRef, useState } from "react"
import { LockKeyhole, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { useForm } from "@tanstack/react-form"
import { useNavigate } from "@tanstack/react-router"
import { z } from "zod"
import logoImage from "../../assets/logo.png"
import FormInputField from "./FormInputField"
import { signInWithUsername, formatAuthError } from "../../services/authService"
import { useAuth } from "../../context/useAuth"

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tên đăng nhập")
    .max(50, "Tên đăng nhập không được quá 50 ký tự"),
  password: z
    .string()
    .min(1, "Vui lòng nhập mật khẩu")
    .max(64, "Mật khẩu không được quá 64 ký tự"),
})

export function LoginForm() {
  const navigate = useNavigate()
  const { isAuthenticated, username: activeUser, signOut, refreshTeam } = useAuth()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success">("idle")
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onChange: loginSchema,
    },
    onSubmit: async ({ value }) => {
      setErrorMessage(null)
      const { error } = await signInWithUsername(value.username, value.password)
      if (error) {
        setErrorMessage(formatAuthError(error))
        return
      }
      await refreshTeam()
      setSubmitStatus("success")
      redirectTimeoutRef.current = setTimeout(() => {
        navigate({ to: "/game" })
      }, 800)
    },
  })

  if (isAuthenticated && submitStatus !== "success") {
    return (
      <section className="animate-enter-scale mx-auto w-full max-w-lg" style={{ animationDelay: "300ms" }}>
        <div className="content-panel rounded-2xl border border-primary/50 p-6 text-center shadow-[0_0_45px_rgba(202,160,82,0.16)] transition-shadow duration-500 focus-within:shadow-[0_0_55px_rgba(202,160,82,0.24)] sm:p-10">
          <CheckCircle2 className="mx-auto size-12 text-primary" />
          <h2 className="mt-4 font-display text-3xl font-semibold text-foreground">Đã xác thực</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bạn đang đăng nhập với tư cách là đội thám tử <span className="font-mono font-bold text-primary">{activeUser}</span>.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate({ to: "/game" })}
              className="flex h-11 flex-1 items-center justify-center rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0 active:scale-[0.98]"
            >
              Bắt đầu phá án
            </button>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex h-11 flex-1 items-center justify-center rounded-lg border border-border px-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground transition-all hover:-translate-y-0.5 hover:text-foreground active:translate-y-0 active:scale-[0.98]"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="animate-enter-scale mx-auto w-full max-w-lg" style={{ animationDelay: "300ms" }}>
      <div className="content-panel rounded-2xl border border-primary/50 p-6 shadow-[0_0_45px_rgba(202,160,82,0.16)] transition-shadow duration-500 focus-within:shadow-[0_0_55px_rgba(202,160,82,0.24)] sm:p-10">
        <div className="mb-8 lg:hidden">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="JS Club logo" className="size-9 object-contain" />
            <p className="font-display text-lg font-bold tracking-[0.14em] text-primary">CØDETECTOR</p>
          </div>
        </div>

        <div className="border-b border-border/60 pb-6">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">ACCESS / 01</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-foreground sm:text-5xl">Đăng nhập</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Sử dụng tài khoản thí sinh được Ban tổ chức cấp để truy cập hệ thống.</p>
        </div>

        <form
          className="mt-7 space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          {errorMessage && (
            <div
              role="alert"
              className="animate-enter-up flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs leading-relaxed text-destructive"
            >
              <AlertTriangle className="size-4 shrink-0 text-destructive" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form.Field
            name="username"
            children={(field) => (
              <FormInputField
                id={field.name}
                name={field.name}
                label="Tên đăng nhập"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập đội thi"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(val) => field.handleChange(val)}
                hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                errorMessage={field.state.meta.errors[0]?.message}
              />
            )}
          />

          <form.Field
            name="password"
            children={(field) => (
              <FormInputField
                id={field.name}
                name={field.name}
                label="Mật khẩu"
                type="password"
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(val) => field.handleChange(val)}
                hasError={field.state.meta.isTouched && field.state.meta.errors.length > 0}
                errorMessage={field.state.meta.errors[0]?.message}
              />
            )}
          />

          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold uppercase tracking-[0.16em] text-primary-foreground shadow-[0_0_22px_rgba(202,160,82,0.25)] transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(202,160,82,0.35)] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <LockKeyhole className="size-4" />
                    <span>Đăng nhập</span>
                  </>
                )}
              </button>
            )}
          />

          {submitStatus === "success" && (
            <div role="status" className="animate-enter-up flex items-center justify-center gap-2 rounded-lg border border-primary/45 bg-primary/10 p-3 text-center text-xs leading-relaxed text-primary">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              <span>Đăng nhập thành công! Chuẩn bị hành trình phá án...</span>
            </div>
          )}
        </form>

        <p className="mt-7 border-t border-border/50 pt-5 text-center text-xs text-muted-foreground">
          Tài khoản được Ban tổ chức cấp riêng cho từng thí sinh. Liên hệ BTC nếu gặp sự cố.
        </p>
      </div>
      <p className="mt-5 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">CASE FILE: PARALLAX / RESTRICTED ACCESS</p>
    </section>
  )
}

export default LoginForm
