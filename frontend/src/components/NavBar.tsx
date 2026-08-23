import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Menu,
  X,
} from "lucide-react";

import { T } from "../design/tokens";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../i18n/LanguageContext";
import * as api from "../api/endpoints";

export function NavBar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /*
   * ---------------------------------------------------------
   * LOAD NOTIFICATIONS
   * ---------------------------------------------------------
   *
   * Notifications are loaded whenever the logged-in user
   * changes.
   *
   * We keep both read and unread notifications.
   * The badge only counts unread notifications.
   */
  useEffect(() => {
    if (!user) {
      setUnread(0);
      setNotifications([]);
      setNotificationOpen(false);
      return;
    }

    api
      .listNotifications()
      .then((data) => {
        const results = (data.results || []).slice(0, 20);

        setNotifications(results);

        setUnread(
          results.filter(
            (notification) => !notification.read
          ).length
        );
      })
      .catch((error) => {
        console.error(
          "Failed to load notifications:",
          error
        );

        setNotifications([]);
        setUnread(0);
      });
  }, [user]);

  /*
   * ---------------------------------------------------------
   * MOBILE MENU
   * ---------------------------------------------------------
   */
  const closeMobile = () => {
    setMobileOpen(false);
  };

  /*
   * ---------------------------------------------------------
   * STAFF / MODERATOR CHECK
   * ---------------------------------------------------------
   */
  const isStaffLike =
    Boolean(user?.is_staff) ||
    Boolean(user?.is_superuser) ||
    Boolean(user?.is_moderator);

  /*
   * ---------------------------------------------------------
   * OPEN / CLOSE NOTIFICATIONS
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * When the user OPENS the notification panel:
   *
   * 1. Panel opens.
   * 2. Unread notifications are marked as read.
   * 3. Notifications remain visible.
   * 4. Badge becomes 0.
   *
   * This gives the behavior:
   *
   *     🔔 3
   *
   *     click bell
   *
   *     🔔
   *
   * Notifications are still visible inside the panel.
   */
  const toggleNotifications = async () => {
    const willOpen = !notificationOpen;

    setNotificationOpen(willOpen);

    if (!willOpen) {
      return;
    }

    if (unread === 0) {
      return;
    }

    try {
      await api.markAllNotificationsRead();

      /*
       * Keep notifications in the UI.
       * Only change their read state.
       */
      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      /*
       * Remove unread badge.
       */
      setUnread(0);
    } catch (error) {
      console.error(
        "Failed to mark notifications as read:",
        error
      );

      /*
       * If the API fails, keep the unread count.
       */
    }
  };

  /*
   * ---------------------------------------------------------
   * MARK ALL AS READ
   * ---------------------------------------------------------
   *
   * This is still available from inside the panel.
   */
  const markAllAsRead = async () => {
    if (unread === 0) {
      return;
    }

    try {
      await api.markAllNotificationsRead();

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );

      setUnread(0);
    } catch (error) {
      console.error(
        "Failed to mark notifications as read:",
        error
      );
    }
  };

  /*
   * ---------------------------------------------------------
   * NOTIFICATION CLICK
   * ---------------------------------------------------------
   */
  const handleNotificationClick = (
    notification: any
  ) => {
    setNotificationOpen(false);
    closeMobile();

    /*
     * New review submitted
     * → Staff moderation page
     */
    if (
      notification.type === "review_submitted"
    ) {
      navigate("/admin/moderation");
      return;
    }

    /*
     * Review status notifications
     * → User's reviews
     */
    if (
      notification.type === "review_verified" ||
      notification.type === "review_rejected" ||
      notification.type === "review_needs_info" ||
      notification.type ===
        "review_published_unverified"
    ) {
      navigate("/my-reviews");
      return;
    }
  };

  return (
    <div
      style={{
        borderBottom: `1px solid ${T.line}`,
        background: T.paperRaised,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: "0 auto",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* =====================================================
            LOGO
        ===================================================== */}

        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: T.displayFont,
            fontWeight: 700,
            fontSize: 19,
            color: T.navy,
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: T.navy,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
            }}
          >
            PF
          </div>

          TrueClaim
        </Link>

        {/* =====================================================
            DESKTOP NAVIGATION
        ===================================================== */}

        <div
          className="pf-nav-desktop-links"
          style={{
            gap: 16,
            alignItems: "center",
            fontSize: 13.5,
            fontWeight: 500,
            color: T.inkSoft,
          }}
        >
          <Link
            to="/"
            style={navLink}
          >
            {t("nav_services")}
          </Link>

          <Link
            to="/about-us"
            style={navLink}
          >
            About Us
          </Link>

          <Link
            to="/contact-us"
            style={navLink}
          >
            Contact Us
          </Link>

          {/* MY REVIEWS */}
          {user && !isStaffLike && (
            <Link
              to="/my-reviews"
              style={navLink}
            >
              {t("nav_my_reviews")}
            </Link>
          )}

          {/* =================================================
              LANGUAGE
          ================================================= */}

          <div
            style={{
              display: "flex",
              border: `1px solid ${T.line}`,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-pressed={lang === "en"}
              style={{
                border: "none",
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                background:
                  lang === "en"
                    ? T.navy
                    : "transparent",
                color:
                  lang === "en"
                    ? "#fff"
                    : T.inkSoft,
              }}
            >
              English
            </button>

            <button
              type="button"
              onClick={() => setLang("te")}
              aria-pressed={lang === "te"}
              style={{
                border: "none",
                padding: "5px 12px",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                background:
                  lang === "te"
                    ? T.navy
                    : "transparent",
                color:
                  lang === "te"
                    ? "#fff"
                    : T.inkSoft,
              }}
            >
              తెలుగు
            </button>
          </div>

          {/* =================================================
              MODERATION
          ================================================= */}

          {isStaffLike && (
            <Link
              to="/admin/moderation"
              style={navLink}
            >
              {t("nav_moderation")}
            </Link>
          )}

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          {user && (
            <div
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                onClick={toggleNotifications}
                aria-label="Notifications"
                aria-expanded={notificationOpen}
                style={{
                  position: "relative",
                  width: 38,
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${T.line}`,
                  borderRadius: 9,
                  background: "#fff",
                  color: T.inkSoft,
                  cursor: "pointer",
                }}
              >
                <Bell size={17} />

                {unread > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      minWidth: 17,
                      height: 17,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: T.danger,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: "1px 4px",
                    }}
                  >
                    {unread}
                  </span>
                )}
              </button>

              {notificationOpen && (
                <NotificationPanel
                  notifications={notifications}
                  onMarkAllAsRead={markAllAsRead}
                  onNotificationClick={
                    handleNotificationClick
                  }
                />
              )}
            </div>
          )}

          {/* =================================================
              LOGIN / LOGOUT
          ================================================= */}

          {user ? (
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              style={{
                background: "none",
                border: "none",
                color: T.inkSoft,
                cursor: "pointer",
                fontFamily: T.bodyFont,
                fontSize: 13.5,
              }}
            >
              {t("nav_logout")} ({user.username})
            </button>
          ) : (
            <Link
              to="/login"
              style={navLink}
            >
              {t("nav_staff_login")}
            </Link>
          )}
        </div>

        {/* =====================================================
            MOBILE HAMBURGER
        ===================================================== */}

        <button
          className="pf-nav-hamburger-btn"
          type="button"
          onClick={() =>
            setMobileOpen((value) => !value)
          }
          aria-label={
            mobileOpen
              ? "Close menu"
              : "Open menu"
          }
          aria-expanded={mobileOpen}
          style={{
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            border: `1px solid ${T.line}`,
            borderRadius: 8,
            background: "transparent",
            color: T.navy,
            cursor: "pointer",
          }}
        >
          {mobileOpen ? (
            <X size={19} />
          ) : (
            <Menu size={19} />
          )}
        </button>
      </div>

      {/* =======================================================
          MOBILE MENU
      ======================================================= */}

      <div
        className={`pf-nav-mobile-menu${
          mobileOpen ? " open" : ""
        }`}
        style={{
          flexDirection: "column",
          gap: 2,
          padding: "8px 24px 16px",
          borderTop: `1px solid ${T.line}`,
          fontSize: 14,
          fontWeight: 500,
          color: T.inkSoft,
        }}
      >
        <Link
          to="/"
          onClick={closeMobile}
          style={mobileLink}
        >
          {t("nav_services")}
        </Link>

        <Link
          to="/about-us"
          onClick={closeMobile}
          style={mobileLink}
        >
          About Us
        </Link>

        <Link
          to="/contact-us"
          onClick={closeMobile}
          style={mobileLink}
        >
          Contact Us
        </Link>

        {user && !isStaffLike && (
          <Link
            to="/my-reviews"
            onClick={closeMobile}
            style={mobileLink}
          >
            {t("nav_my_reviews")}
          </Link>
        )}

        {/* =================================================
            MOBILE NOTIFICATIONS
        ================================================= */}

        {user && (
          <button
            type="button"
            onClick={toggleNotifications}
            aria-expanded={notificationOpen}
            style={{
              ...mobileLink,
              width: "100%",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: T.bodyFont,
              color: T.inkSoft,
              textAlign: "left",
              gap: 10,
            }}
          >
            <span
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Bell size={17} />

              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -8,
                    minWidth: 17,
                    height: 17,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: T.danger,
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 700,
                    borderRadius: 999,
                    padding: "1px 4px",
                  }}
                >
                  {unread}
                </span>
              )}
            </span>

            Notifications
          </button>
        )}

        {/* MOBILE NOTIFICATION PANEL */}

        {user && notificationOpen && (
          <div
            style={{
              padding: "0 0 8px",
            }}
          >
            <NotificationPanel
              notifications={notifications}
              onMarkAllAsRead={markAllAsRead}
              onNotificationClick={
                handleNotificationClick
              }
              mobile
            />
          </div>
        )}

        {/* =================================================
            MODERATION
        ================================================= */}

        {isStaffLike && (
          <Link
            to="/admin/moderation"
            onClick={closeMobile}
            style={mobileLink}
          >
            {t("nav_moderation")}
          </Link>
        )}

        {/* =================================================
            LANGUAGE
        ================================================= */}

        <div
          style={{
            display: "flex",
            border: `1px solid ${T.line}`,
            borderRadius: 999,
            overflow: "hidden",
            width: "fit-content",
            margin: "8px 0",
          }}
        >
          <button
            type="button"
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            style={{
              border: "none",
              padding: "6px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background:
                lang === "en"
                  ? T.navy
                  : "transparent",
              color:
                lang === "en"
                  ? "#fff"
                  : T.inkSoft,
            }}
          >
            English
          </button>

          <button
            type="button"
            onClick={() => setLang("te")}
            aria-pressed={lang === "te"}
            style={{
              border: "none",
              padding: "6px 14px",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: "pointer",
              background:
                lang === "te"
                  ? T.navy
                  : "transparent",
              color:
                lang === "te"
                  ? "#fff"
                  : T.inkSoft,
            }}
          >
            తెలుగు
          </button>
        </div>

        {/* =================================================
            LOGIN / LOGOUT
        ================================================= */}

        {user ? (
          <button
            type="button"
            onClick={() => {
              closeMobile();
              logout();
              navigate("/");
            }}
            style={{
              ...mobileLink,
              width: "100%",
              background: "none",
              border: "none",
              textAlign: "left",
              cursor: "pointer",
              fontFamily: T.bodyFont,
            }}
          >
            {t("nav_logout")} ({user.username})
          </button>
        ) : (
          <Link
            to="/login"
            onClick={closeMobile}
            style={mobileLink}
          >
            {t("nav_staff_login")}
          </Link>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   NOTIFICATION PANEL
============================================================ */

function NotificationPanel({
  notifications,
  onMarkAllAsRead,
  onNotificationClick,
  mobile = false,
}: {
  notifications: any[];
  onMarkAllAsRead: () => void;
  onNotificationClick: (
    notification: any
  ) => void;
  mobile?: boolean;
}) {
  const unreadCount =
    notifications.filter(
      (notification) => !notification.read
    ).length;

  return (
    <div
      style={{
        position: mobile
          ? "relative"
          : "absolute",

        top: mobile
          ? undefined
          : 46,

        right: mobile
          ? undefined
          : 0,

        width: mobile
          ? "100%"
          : 390,

        maxWidth: mobile
          ? "100%"
          : "calc(100vw - 24px)",

        background: "#fff",

        border: `1px solid ${T.line}`,

        borderRadius: 14,

        boxShadow:
          "0 14px 40px rgba(0,0,0,0.14)",

        overflow: "hidden",

        zIndex: 200,
      }}
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        style={{
          padding: "14px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          borderBottom: `1px solid ${T.line}`,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.ink,
            }}
          >
            Notifications
          </div>

          {unreadCount > 0 && (
            <div
              style={{
                marginTop: 2,
                fontSize: 11.5,
                color: T.inkFaint,
              }}
            >
              {unreadCount} unread
            </div>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllAsRead}
            style={{
              border: "none",
              background: "transparent",
              color: T.navy,
              fontSize: 11.5,
              fontWeight: 700,
              cursor: "pointer",
              padding: "5px 2px",
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* =====================================================
          NOTIFICATION LIST
      ===================================================== */}

      {notifications.length === 0 ? (
        <div
          style={{
            padding: "30px 20px",
            fontSize: 13,
            color: T.inkSoft,
            textAlign: "center",
          }}
        >
          You're all caught up.
        </div>
      ) : (
        <div
          style={{
            maxHeight: mobile
              ? 420
              : 380,
            overflowY: "auto",
          }}
        >
          {notifications.map(
            (notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() =>
                  onNotificationClick(
                    notification
                  )
                }
                mobile={mobile}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   NOTIFICATION ITEM
============================================================ */

function NotificationItem({
  notification,
  onClick,
  mobile = false,
}: {
  notification: any;
  onClick: () => void;
  mobile?: boolean;
}) {
  const unread = !notification.read;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%",
        display: "block",
        border: "none",
        borderBottom: `1px solid ${T.line}`,

        background: unread
          ? "#F7FAFC"
          : "#fff",

        padding: mobile
          ? "14px 15px"
          : "14px 16px",

        textAlign: "left",
        cursor: "pointer",
        fontFamily: T.bodyFont,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.background =
          unread
            ? "#F0F5F9"
            : "#FAFBFC";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.background =
          unread
            ? "#F7FAFC"
            : "#fff";
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 11,
        }}
      >
        {/* =================================================
            ICON
        ================================================= */}

        <div
          style={{
            width: 30,
            height: 30,
            minWidth: 30,
            borderRadius: 9,

            background:
              getNotificationIconBackground(
                notification.type
              ),

            color:
              getNotificationIconColor(
                notification.type
              ),

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            fontSize: 14,
            fontWeight: 800,
          }}
        >
          {getNotificationIcon(
            notification.type
          )}
        </div>

        {/* =================================================
            TEXT
        ================================================= */}

        <div
          style={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.4,
                color: T.ink,

                fontWeight: unread
                  ? 700
                  : 600,

                overflowWrap:
                  "anywhere",
              }}
            >
              {getNotificationMessage(
                notification
              )}
            </div>

            {/* UNREAD DOT */}

            {unread && (
              <span
                aria-label="Unread"
                style={{
                  width: 7,
                  height: 7,
                  minWidth: 7,
                  marginTop: 5,
                  borderRadius: "50%",
                  background: T.navy,
                }}
              />
            )}
          </div>

          {/* SUBTITLE */}

          <div
            style={{
              marginTop: 3,
              fontSize: 12,
              lineHeight: 1.45,
              color: T.inkSoft,
              overflowWrap: "anywhere",
            }}
          >
            {getNotificationSubtitle(
              notification
            )}
          </div>

          {/* TIME */}

          <div
            style={{
              marginTop: 5,
              fontSize: 10.5,
              color: T.inkFaint,
            }}
          >
            {formatNotificationTime(
              notification.created_at
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

/* ============================================================
   NOTIFICATION MESSAGE
============================================================ */

function getNotificationMessage(
  notification: any
) {
  switch (notification.type) {
    case "review_submitted":
      return "New review submitted";

    case "review_verified":
      return "Review verified";

    case "review_rejected":
      return "Review rejected";

    case "review_needs_info":
      return "More information required";

    case "review_published_unverified":
      return "Review published";

    case "general":
      return (
        notification.message ||
        "New notification"
      );

    default:
      return (
        notification.message ||
        "New notification"
      );
  }
}

/* ============================================================
   NOTIFICATION SUBTITLE
============================================================ */

function getNotificationSubtitle(
  notification: any
) {
  switch (notification.type) {
    case "review_submitted":
      return "Review needs moderation";

    case "review_verified":
      return "Your review has been verified";

    case "review_rejected":
      return "Your review was not approved";

    case "review_needs_info":
      return "Please provide additional information";

    case "review_published_unverified":
      return "Your review is now publicly available";

    case "general":
      return notification.message || "";

    default:
      return notification.message || "";
  }
}

/* ============================================================
   NOTIFICATION ICON
============================================================ */

function getNotificationIcon(
  type: string
) {
  switch (type) {
    case "review_submitted":
      return "🔔";

    case "review_verified":
      return "✓";

    case "review_rejected":
      return "⚠";

    case "review_needs_info":
      return "ℹ";

    case "review_published_unverified":
      return "✓";

    default:
      return "🔔";
  }
}

/* ============================================================
   NOTIFICATION ICON BACKGROUND
============================================================ */

function getNotificationIconBackground(
  type: string
) {
  switch (type) {
    case "review_verified":
    case "review_published_unverified":
      return T.verifiedSoft;

    case "review_rejected":
      return "#FBEEEC";

    case "review_needs_info":
      return "#FBF1DE";

    default:
      return "#EAF0F6";
  }
}

/* ============================================================
   NOTIFICATION ICON COLOR
============================================================ */

function getNotificationIconColor(
  type: string
) {
  switch (type) {
    case "review_verified":
    case "review_published_unverified":
      return T.verified;

    case "review_rejected":
      return T.danger;

    case "review_needs_info":
      return "#8A6612";

    default:
      return T.navy;
  }
}

/* ============================================================
   RELATIVE TIME
============================================================ */

function formatNotificationTime(
  value?: string
) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const difference = Math.max(
    0,
    Date.now() - date.getTime()
  );

  const seconds = Math.floor(
    difference / 1000
  );

  const minutes = Math.floor(
    seconds / 60
  );

  const hours = Math.floor(
    minutes / 60
  );

  const days = Math.floor(
    hours / 24
  );

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hour${
      hours === 1 ? "" : "s"
    } ago`;
  }

  if (days < 7) {
    return `${days} day${
      days === 1 ? "" : "s"
    } ago`;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

/* ============================================================
   NAV STYLES
============================================================ */

const navLink: CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  fontWeight: 500,
};

const mobileLink: CSSProperties = {
  color: "inherit",
  textDecoration: "none",
  padding: "10px 4px",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
};