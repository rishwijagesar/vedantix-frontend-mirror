import { useEffect } from "react";
import { AUDIT_FUNNEL_EVENTS, trackAuditFunnel } from "../lib/audit-funnel";

export default function AuditFunnelTracker() {
  useEffect(() => {
    let formStarted = false;
    let resultsVisible = false;
    let failureVisible = false;

    trackAuditFunnel(AUDIT_FUNNEL_EVENTS.PAGE_VIEW);

    const inspectAuditState = () => {
      const nextResultsVisible = Boolean(document.querySelector(".audit-results"));
      if (nextResultsVisible && !resultsVisible) {
        trackAuditFunnel(AUDIT_FUNNEL_EVENTS.RESULT_VIEWED);
      }
      resultsVisible = nextResultsVisible;

      const nextFailureVisible = Boolean(document.querySelector(".audit-progress-card.failed"));
      if (nextFailureVisible && !failureVisible) {
        trackAuditFunnel(AUDIT_FUNNEL_EVENTS.AUDIT_FAILED);
      }
      failureVisible = nextFailureVisible;
    };

    const handleFocusIn = (event) => {
      if (formStarted || !(event.target instanceof Element)) return;
      if (!event.target.closest(".audit-form")) return;
      formStarted = true;
      trackAuditFunnel(AUDIT_FUNNEL_EVENTS.FORM_STARTED);
    };

    const handleClick = (event) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest(".audit-final-cta a");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      if (href.startsWith("/planning")) {
        trackAuditFunnel(AUDIT_FUNNEL_EVENTS.PLANNING_CLICK);
      } else if (/^https?:\/\/wa\.me\//i.test(href)) {
        trackAuditFunnel(AUDIT_FUNNEL_EVENTS.WHATSAPP_CLICK);
      }
    };

    const observer = new MutationObserver(inspectAuditState);
    observer.observe(document.body, { childList: true, subtree: true });
    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("click", handleClick);
    inspectAuditState();

    return () => {
      observer.disconnect();
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("click", handleClick);
    };
  }, []);

  return null;
}
