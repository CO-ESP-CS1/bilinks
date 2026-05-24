"use client";

import { useCallback, useState } from "react";

export function useModal(initial = false) {
  const [isOpen, setIsOpen] = useState(initial);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen((v) => !v), []);

  return { isOpen, openModal, closeModal, toggleModal, setIsOpen };
}
