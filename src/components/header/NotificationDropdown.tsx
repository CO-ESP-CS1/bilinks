"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import {
  countUnreadAdminNotifications,
  getAdminNotificationFeed,
  type AdminNotificationFeedItem,
  type NotificationFeedType,
} from "@/lib/admin-notifications-feed";
import {
  BellIcon,
  ChatIcon,
  DocsIcon,
  DollarLineIcon,
  ShootingStarIcon,
  UserIcon,
  AlertIcon,
} from "@/icons";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

const TYPE_STYLES: Record<
  NotificationFeedType,
  { wrap: string; icon: string; Icon: typeof UserIcon }
> = {
  inscription: {
    wrap: "bg-blue-light-50 dark:bg-blue-light-500/15",
    icon: "text-blue-light-500",
    Icon: UserIcon,
  },
  paiement: {
    wrap: "bg-success-50 dark:bg-success-500/15",
    icon: "text-success-600 dark:text-success-500",
    Icon: DollarLineIcon,
  },
  commentaire: {
    wrap: "bg-warning-50 dark:bg-warning-500/15",
    icon: "text-warning-600 dark:text-orange-400",
    Icon: ChatIcon,
  },
  livre: {
    wrap: "bg-[#f5f3ff] dark:bg-violet-500/15",
    icon: "text-violet-600 dark:text-violet-400",
    Icon: DocsIcon,
  },
  badge: {
    wrap: "bg-gray-100 dark:bg-white/5",
    icon: "text-gray-700 dark:text-gray-300",
    Icon: ShootingStarIcon,
  },
  push: {
    wrap: "bg-brand-500/10 text-brand-600 dark:text-brand-400",
    icon: "text-brand-500",
    Icon: BellIcon,
  },
  alerte: {
    wrap: "bg-error-500/10 text-error-600 dark:text-error-500",
    icon: "text-error-500",
    Icon: AlertIcon,
  },
};

function NotificationRow({
  item,
  onClose,
}: {
  item: AdminNotificationFeedItem;
  onClose: () => void;
}) {
  const styles = TYPE_STYLES[item.type] ?? TYPE_STYLES.push;
  const Icon = styles.Icon;
  const content = (
    <>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${styles.wrap}`}
      >
        <Icon className={`size-5 ${styles.icon}`} />
      </span>
      <span className="block min-w-0 flex-1">
        <span className="mb-1 block text-theme-sm font-medium text-gray-800 dark:text-white/90">
          {item.titre}
        </span>
        <span className="line-clamp-2 text-theme-sm text-gray-500 dark:text-gray-400">
          {item.message}
        </span>
        <span className="mt-1 flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
          <span>
            {item.type === "push"
              ? "Notification push"
              : item.type === "alerte"
                ? "Alerte admin"
                : item.type === "badge"
                  ? "Badge"
                  : "Activité"}
          </span>
          <span className="h-1 w-1 rounded-full bg-gray-400" aria-hidden />
          <span>{item.temps}</span>
        </span>
      </span>
    </>
  );

  if (item.href) {
    return (
      <DropdownItem
        onItemClick={onClose}
        tag="a"
        href={item.href}
        className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
      >
        {content}
      </DropdownItem>
    );
  }

  return (
    <DropdownItem
      onItemClick={onClose}
      className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
    >
      {content}
    </DropdownItem>
  );
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [lue, setLue] = useState(false);

  const feed = useMemo(() => getAdminNotificationFeed(), []);
  const badgeCount = useMemo(() => countUnreadAdminNotifications(), []);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setLue(true);
  };

  const showBadge = !lue && badgeCount > 0;

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {showBadge && (
          <span className="absolute right-0 top-0.5 z-10 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-400" />
          </span>
        )}
        <BellIcon className="size-5" />
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h5 className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
            <BellIcon className="size-5 text-brand-500" />
            Notifications
          </h5>
          <button
            type="button"
            onClick={toggleDropdown}
            aria-label="Fermer"
            className="dropdown-toggle text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
        <ul className="custom-scrollbar flex h-auto flex-col overflow-y-auto">
          {feed.length === 0 ? (
            <li className="flex flex-col items-center px-4 py-8 text-center">
              <BellIcon className="mb-2 size-8 text-gray-300 dark:text-gray-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Aucune notification
              </span>
            </li>
          ) : (
            feed.map((item) => (
              <li key={item.id}>
                <NotificationRow item={item} onClose={closeDropdown} />
              </li>
            ))
          )}
        </ul>
        <Link
          href="/admin/notifications"
          onClick={closeDropdown}
          className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          Voir toutes les notifications
        </Link>
      </Dropdown>
    </div>
  );
}
