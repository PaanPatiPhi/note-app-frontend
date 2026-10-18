"use client"

import * as React from "react"
import { Toast as ToastPrimitive } from "@base-ui/react/toast"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon, CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon } from "lucide-react"
import Loading from "@/components/Loading"

const baseToast = ToastPrimitive.createToastManager()

const toast = Object.assign(baseToast, {
  success: (title: string, description?: string) =>
    baseToast.add({ type: "success", title, description }),
  error: (title: string, description?: string) =>
    baseToast.add({ type: "error", title, description }),
  info: (title: string, description?: string) =>
    baseToast.add({ type: "info", title, description }),
  warning: (title: string, description?: string) =>
    baseToast.add({ type: "warning", title, description }),
})

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 w-[calc(100vw-2.5rem)] max-w-sm pointer-events-none outline-none sm:bottom-6 sm:right-6",
        className
      )}
      {...props}
    />
  )
}

function Toast({ className, ...props }: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "jodjod-toast group/toast pointer-events-auto relative flex w-full items-start gap-3 rounded-2xl border border-[#D1CEC5] bg-[#FAF9F6] p-4 text-[#26343F] shadow-xl shadow-[#26343F]/10 select-none",
        "data-[limited]:opacity-0 data-[limited]:pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex w-full items-start gap-3 min-w-0",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("text-sm font-bold text-[#26343F] leading-tight", className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-xs sm:text-sm text-[#66737D] leading-relaxed mt-0.5", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0 self-center", className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Close toast"
      className={cn(
        "relative shrink-0 text-[#9AA4AA] hover:text-[#26343F] p-1.5 rounded-lg hover:bg-[#E6E3DC]/60 transition-colors cursor-pointer self-start -mr-1 -mt-1 ml-auto",
        className
      )}
      {...props}
    >
      {children ?? (
        <XIcon className="h-4 w-4" aria-hidden="true" />
      )}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({ type }: { type: string | undefined }) {
  let icon: React.ReactNode = null

  if (type === "success") {
    icon = (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#2E7D32]/10 text-[#2E7D32]">
        <CircleCheckIcon className="h-4 w-4" aria-hidden="true" />
      </div>
    )
  } else if (type === "info") {
    icon = (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3D5A73]/10 text-[#3D5A73]">
        <InfoIcon className="h-4 w-4" aria-hidden="true" />
      </div>
    )
  } else if (type === "warning") {
    icon = (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#D8B968]/20 text-[#B89230]">
        <TriangleAlertIcon className="h-4 w-4" aria-hidden="true" />
      </div>
    )
  } else if (type === "error") {
    icon = (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#A34F45]/10 text-[#A34F45]">
        <OctagonXIcon className="h-4 w-4" aria-hidden="true" />
      </div>
    )
  } else if (type === "loading") {
    icon = (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#3D5A73]/10">
        <Loading size="xs" />
      </div>
    )
  }

  if (!icon) {
    return null
  }

  return icon
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  if (!toasts || toasts.length === 0) {
    return null
  }

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = baseToast,
  timeout = 4000,
  limit = 5,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} timeout={timeout} limit={limit} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}
