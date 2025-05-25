"use client";
import React, { useState, useRef, useEffect } from "react";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";
import styles from "./UserMenu.module.css";

const UserMenu: React.FC = () => {
  const { user, logout } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) return null;

  return (
    <div className={styles.menuWrapper} ref={menuRef}>
      <button className={styles.userBtn} onClick={() => setOpen((v) => !v)}>
        <span className={styles.userIcon}>👤</span>
      </button>
      {open && (
        <div className={styles.menuBox}>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{user?.name || user?.email?.split("@")[0]}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <div className={styles.menuDivider} />
          <div className={styles.menuItem}>ACCOUNT SETTINGS</div>
          <button
            className={styles.logoutBtn}
            onClick={() => {
              logout();
              router.push("/login");
            }}
          >
            LOG OUT <span className={styles.arrowIcon}>&#8594;</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu; 