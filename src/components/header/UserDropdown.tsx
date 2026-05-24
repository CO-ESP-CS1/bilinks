"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAuth } from "@/context/AuthContext";
import { getDisplayName } from "@/lib/auth/admin-auth";

export default function UserDropdown() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!admin) return null;

  const displayName = getDisplayName(admin);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleLogout = () => {
    closeDropdown();
    logout();
    router.push("/signin");
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Menu utilisateur"
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
      >
        <span className="mr-3 h-11 w-11 overflow-hidden rounded-full">
          <Image
            width={44}
            height={44}
            src={admin.avatarUrl}
            alt=""
            className="h-full w-full object-cover"
            unoptimized={admin.avatarUrl.startsWith("data:")}
          />
        </span>
        <span className="mr-1 hidden font-medium text-theme-sm sm:block">
          {admin.prenom}
        </span>
        <svg
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
      >
        <div>
          <span className="block font-medium text-theme-sm text-gray-700 dark:text-gray-400">
            {displayName}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {admin.email}
          </span>
        </div>

        <ul className="flex flex-col gap-1 border-b border-gray-200 pb-3 pt-4 dark:border-gray-800">
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/admin/profile"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              Modifier le profil
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/admin/administrateurs"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              Administrateurs
            </DropdownItem>
          </li>
          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/admin/account-settings"
              className="group flex items-center gap-3 rounded-lg px-3 py-2 font-medium text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              Paramètres du compte
            </DropdownItem>
          </li>
        </ul>

        <button
          type="button"
          onClick={handleLogout}
          className="group mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left font-medium text-theme-sm text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
        >
          Déconnexion
        </button>
      </Dropdown>
    </div>
  );
}
