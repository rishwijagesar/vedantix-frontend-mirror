import { useEffect, useRef } from "react";

const JOTFORM_WIDGET_ID =
  "JFWebsiteWidget-019e92edd9f87a41aae99010d53be8d25324";
const JOTFORM_SCRIPT_ID =
  "jotform-review-widget-019e92edd9f87a41aae99010d53be8d25324";
const JOTFORM_SCRIPT_SRC =
  "https://www.jotform.com/website-widgets/embed/019e92edd9f87a41aae99010d53be8d25324";

export default function JotformReviewWidget() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let script;
    const load = () => {
      if (script) return;
      document.getElementById(JOTFORM_SCRIPT_ID)?.remove();
      script = document.createElement("script");
      script.id = JOTFORM_SCRIPT_ID;
      script.src = JOTFORM_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    };
    const observer =
      typeof IntersectionObserver === "function"
        ? new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                observer.disconnect();
                load();
              }
            },
            { rootMargin: "200px" },
          )
        : null;
    if (observer) observer.observe(container);
    else load();

    return () => {
      observer?.disconnect();
      script?.remove();
      container.replaceChildren();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id={JOTFORM_WIDGET_ID}
      className="vedantix-reviews"
    />
  );
}
