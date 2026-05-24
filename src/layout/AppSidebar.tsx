"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import {
  adminNavSections,
  type AdminNavItem,
} from "@/config/admin-navigation";
import {
  BellIcon,
  BoltIcon,
  ChatIcon,
  DocsIcon,
  DollarLineIcon,
  BoxCubeIcon,
  FolderIcon,
  GridIcon,
  GroupIcon,
  HorizontaLDots,
  LockIcon,
  PencilIcon,
  PieChartIcon,
  ShootingStarIcon,
} from "../icons/index";
import { BrandMark } from "@/components/common/BrandMark";

function iconForItem(item: AdminNavItem): React.ReactNode {
  if (item.path === "/admin/administrateurs") {
    return <LockIcon />;
  }
  switch (item.path) {
    case "/admin":
      return <GridIcon />;
    case "/admin/livres":
      return <DocsIcon />;
    case "/admin/auteurs":
      return <PencilIcon />;
    case "/admin/categories":
      return <FolderIcon />;
    case "/admin/utilisateurs":
      return <GroupIcon />;
    case "/admin/abonnements":
      return <ShootingStarIcon />;
    case "/admin/paiements":
      return <DollarLineIcon />;
    case "/admin/bibliotheques":
      return <BoxCubeIcon />;
    case "/admin/defis":
      return <BoltIcon />;
    case "/admin/commentaires":
      return <ChatIcon />;
    case "/admin/notifications":
      return <BellIcon />;
    case "/admin/statistiques":
      return <PieChartIcon />;
    default:
      return <GridIcon />;
  }
}

function pathIsActive(path: string, pathname: string): boolean {
  if (path === "/admin") {
    return pathname === "/admin";
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
              ? "w-[290px]"
              : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex  ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <BrandMark
          showText={isExpanded || isHovered || isMobileOpen}
        />
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {adminNavSections.map((section) => (
              <div key={section.title}>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    section.title
                  ) : (
                    <HorizontaLDots />
                  )}
                </h2>
                <ul className="flex flex-col gap-4">
                  {section.items.map((item) => {
                    const active = pathIsActive(item.path, pathname);
                    const showLabel =
                      isExpanded || isHovered || isMobileOpen;
                    return (
                      <li key={`${section.title}-${item.path}-${item.name}`}>
                        <Link
                          href={item.path}
                          className={`menu-item group ${
                            active
                              ? "menu-item-active"
                              : "menu-item-inactive"
                          }`}
                        >
                          <span
                            className={
                              active
                                ? "menu-item-icon-active"
                                : "menu-item-icon-inactive"
                            }
                          >
                            {iconForItem(item)}
                          </span>
                          {showLabel && (
                            <span className="menu-item-text">{item.name}</span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
