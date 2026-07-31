"use client";
import React, { useMemo } from "react";
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
  BoxIcon,
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
  VideoIcon,
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
    case "/admin/etablissements":
      return <BoxIcon />;
    case "/admin/bibliotheques":
      return <BoxCubeIcon />;
    case "/admin/videos-educatives":
      return <VideoIcon />;
    case "/admin/defis":
      return <BoltIcon />;
    case "/admin/commentaires":
      return <ChatIcon />;
    case "/admin/notifications":
      return <BellIcon />;
    case "/admin/statistiques":
      return <PieChartIcon />;
    case "/admin/performance":
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

  const navDelays = useMemo(() => {
    const delays: { path: string; delay: number }[] = [];
    let i = 0;
    for (const section of adminNavSections) {
      for (const item of section.items) {
        delays.push({ path: item.path, delay: 50 + i * 35 });
        i += 1;
      }
    }
    return delays;
  }, []);

  const delayFor = (path: string) =>
    navDelays.find((d) => d.path === path)?.delay ?? 0;

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0 ${
        isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
      } ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 animate-slide-in-left ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <BrandMark showText={isExpanded || isHovered || isMobileOpen} />
      </div>

      <div className="no-scrollbar mb-6 flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav>
          <div className="flex flex-col gap-4">
            {adminNavSections.map((section) => (
              <div key={section.title}>
                <h2
                  className={`mb-4 flex text-xs uppercase leading-[20px] text-gray-400 ${
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
                <ul className="flex flex-col gap-1.5">
                  {section.items.map((item) => {
                    const active = pathIsActive(item.path, pathname);
                    const showLabel =
                      isExpanded || isHovered || isMobileOpen;

                    return (
                      <li key={`${section.title}-${item.path}-${item.name}`}>
                        <Link
                          href={item.path}
                          style={{ animationDelay: `${delayFor(item.path)}ms` }}
                          className={`menu-item group animate-nav-item-in ${
                            active ? "menu-item-active" : "menu-item-inactive"
                          }`}
                        >
                          {active && (
                            <span
                              className="absolute top-1/2 left-0 h-7 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 shadow-sm shadow-brand-500/40 transition-all duration-300"
                              aria-hidden
                            />
                          )}
                          <span
                            className={`transition-transform duration-200 group-hover:scale-110 ${
                              active
                                ? "menu-item-icon-active"
                                : "menu-item-icon-inactive"
                            }`}
                          >
                            {iconForItem(item)}
                          </span>
                          {showLabel && (
                            <span className="menu-item-text transition-opacity duration-200">
                              {item.name}
                            </span>
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
