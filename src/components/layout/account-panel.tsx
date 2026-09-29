"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import Link from "next/link";

import { ChevronRightIcon, CloseIcon, UserIcon } from "@/components/layout/nav-icons";
import { useTranslations } from "@/contexts/country-context";
import { clearCartBadgeCache } from "@/hooks/use-cart-badge-cache";
import { clearMealPlanCache } from "@/hooks/use-meal-plan-cache";
import type { ApiErrorResponse } from "@/lib/core/types";
import type { ProfileApiResponse, ProfileData } from "@/lib/core/user-types";
import { type AccountMenuEntry, buildAccountMenu } from "@/lib/user/account-menu";

/** The dark green the app uses for the Family badge and label. */
const FAMILY_GREEN = "#295813";

type AccountPanelProps = {
  open: boolean;
  onClose: () => void;
};

type ProfileState =
  | { status: "idle" }
  | { status: "ready"; profile: ProfileData }
  | { status: "error" };

/**
 * Account drawer, mirroring the app's profile sheet: name and address on top,
 * then the account menu in the order Picnic sends it (profile-root). Items
 * without a web counterpart yet are listed but disabled, so the layout matches
 * the app while making the gap explicit.
 */
export function AccountPanel({ open, onClose }: AccountPanelProps) {
  const t = useTranslations();
  const [profileState, setProfileState] = useState<ProfileState>({ status: "idle" });
  const profileRequested = useRef(false);

  // Fetch the profile the first time the panel opens; the result is kept afterwards.
  useEffect(() => {
    if (!open || profileRequested.current) return;
    profileRequested.current = true;
    const controller = new AbortController();

    fetch("/api/user/profile", { signal: controller.signal })
      .then((res) => res.json())
      .then((data: ProfileApiResponse & Partial<ApiErrorResponse>) => {
        if ("error" in data && data.error) {
          setProfileState({ status: "error" });
          return;
        }
        setProfileState({ status: "ready", profile: data });
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") {
          profileRequested.current = false;
          return;
        }
        setProfileState({ status: "error" });
      });

    return () => controller.abort();
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    clearCartBadgeCache();
    clearMealPlanCache();
    window.location.href = "/login";
  }, []);

  if (!open) return null;

  const profile = profileState.status === "ready" ? profileState.profile : null;
  const entries = buildAccountMenu(profile?.menu ?? null, t);
  const title = profile?.name || t.navAccount;

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={t.navAccount}>
      <button
        type="button"
        aria-label={t.closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-black/30"
      />
      <aside className="bg-card-bg absolute inset-y-0 right-0 flex w-full max-w-sm flex-col shadow-xl">
        <div className="flex items-start justify-between p-5">
          <div className="flex items-center gap-4">
            <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <UserIcon className="h-8 w-8" />
              {profile?.hasMembership && (
                <span
                  className="absolute -right-2 -bottom-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-white"
                  style={{ backgroundColor: FAMILY_GREEN }}
                >
                  {t.accountFamilyBadge}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <p className="text-foreground text-xl font-bold">{title}</p>
              {profile?.addressLine && (
                <p className="text-text-muted text-sm">{profile.addressLine}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeLabel}
            className="hover:text-foreground -mr-1 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <ul className="divide-card-border border-card-border flex-1 divide-y overflow-y-auto border-t">
          {entries.map((entry) =>
            entry.href ? (
              <li key={entry.id}>
                <Link
                  href={entry.href}
                  onClick={onClose}
                  className="text-foreground flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50"
                >
                  <MenuLabel entry={entry} />
                  <ChevronRightIcon className="h-4 w-4 text-gray-400" />
                </Link>
              </li>
            ) : (
              <li
                key={entry.id}
                className="flex items-center justify-between px-5 py-4 text-gray-400"
              >
                <MenuLabel entry={entry} />
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium">
                  {t.comingSoon}
                </span>
              </li>
            )
          )}
        </ul>

        <div className="border-card-border border-t p-5">
          <button
            type="button"
            onClick={handleSignOut}
            className="text-picnic-red w-full rounded-full border border-current px-4 py-2 text-sm font-medium transition-colors hover:bg-red-50"
          >
            {t.signOut}
          </button>
        </div>
      </aside>
    </div>
  );
}

/** A menu label; the Family entry shows "Family-account" in green, like the app. */
function MenuLabel({ entry }: { entry: AccountMenuEntry }) {
  const t = useTranslations();
  if (entry.id !== "membershipExisting") return <span>{entry.label}</span>;

  const [before, after = ""] = t.accountFamilyAccount.split("{highlight}");
  return (
    <span>
      {before}
      <span className="font-semibold" style={{ color: FAMILY_GREEN }}>
        {t.accountFamilyAccountHighlight}
      </span>
      {after}
    </span>
  );
}
