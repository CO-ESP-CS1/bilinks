import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Option {
  value: string;
  text: string;
  selected: boolean;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  onChange?: (selected: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

const EMPTY_SELECTED: string[] = [];

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = EMPTY_SELECTED,
  onChange,
  disabled = false,
  placeholder = "Choisir…",
}) => {
  const listboxId = useId();
  const [selectedOptions, setSelectedOptions] = useState<string[]>(
    () => defaultSelected
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateMenuPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const maxHeight = 240;
    const spaceBelow = window.innerHeight - rect.bottom - 8;
    const spaceAbove = rect.top - 8;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

    setMenuStyle({
      position: "fixed",
      left: rect.left,
      width: rect.width,
      zIndex: 100000,
      maxHeight,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) return;
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      const menu = document.getElementById(listboxId);
      if (menu?.contains(target)) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, listboxId]);

  const toggleDropdown = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (optionValue: string) => {
    const newSelectedOptions = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((value) => value !== optionValue)
      : [...selectedOptions, optionValue];

    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  const removeOption = (event: React.MouseEvent, value: string) => {
    event.stopPropagation();
    const newSelectedOptions = selectedOptions.filter((opt) => opt !== value);
    setSelectedOptions(newSelectedOptions);
    onChange?.(newSelectedOptions);
  };

  const dropdown =
    isOpen && isMounted ? (
      <div
        id={listboxId}
        role="listbox"
        aria-multiselectable
        className="overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
        style={menuStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {options.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-gray-500 dark:text-gray-400">
            Aucune option disponible
          </p>
        ) : (
          options.map((option) => {
            const isSelected = selectedOptions.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-brand-50 dark:hover:bg-brand-500/10 ${
                  isSelected
                    ? "bg-brand-50 font-medium text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
                    : "text-gray-800 dark:text-white/90"
                }`}
                onClick={() => handleSelect(option.value)}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isSelected
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  aria-hidden
                >
                  {isSelected ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8.333 2.5L3.75 7.083 1.667 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 truncate">{option.text}</span>
              </button>
            );
          })
        )}
      </div>
    ) : null;

  return (
    <div className="w-full" ref={containerRef}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
        {label}
      </label>

      <div className="relative w-full">
        <div
          ref={triggerRef}
          onClick={toggleDropdown}
          className={`relative flex min-h-11 w-full cursor-pointer items-center rounded-lg border border-gray-300 py-1.5 pl-3 pr-3 shadow-theme-xs outline-hidden transition focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-brand-800 ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          }`}
        >
          <div className="flex min-w-0 flex-1 flex-wrap gap-2">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((value) => {
                const text =
                  options.find((option) => option.value === value)?.text ??
                  value;
                return (
                  <div
                    key={value}
                    className="group flex max-w-full items-center rounded-full border border-gray-200 bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-white/90"
                  >
                    <span className="max-w-[220px] truncate">{text}</span>
                    <button
                      type="button"
                      onClick={(e) => removeOption(e, value)}
                      className="ml-1.5 shrink-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      aria-label={`Retirer ${text}`}
                    >
                      <svg
                        className="fill-current"
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <span className="px-1 py-2 text-sm text-gray-400 dark:text-gray-500">
                {placeholder}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleDropdown();
            }}
            className="ml-2 shrink-0 text-gray-500 dark:text-gray-400"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={isOpen ? "Fermer la liste" : "Ouvrir la liste"}
            disabled={disabled}
          >
            <svg
              className={`stroke-current transition-transform ${isOpen ? "rotate-180" : ""}`}
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4.79175 7.39551L10.0001 12.6038L15.2084 7.39551"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {dropdown && createPortal(dropdown, document.body)}
      </div>
    </div>
  );
};

export default MultiSelect;
