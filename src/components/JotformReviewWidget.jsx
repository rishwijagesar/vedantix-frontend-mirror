import { useEffect } from "react";

const JOTFORM_WIDGET_ID = "JFWebsiteWidget-019e92edd9f87a41aae99010d53be8d25324";
const JOTFORM_SCRIPT_ID = "jotform-review-widget-019e92edd9f87a41aae99010d53be8d25324";
const JOTFORM_SCRIPT_SRC =
  "https://www.jotform.com/website-widgets/embed/019e92edd9f87a41aae99010d53be8d25324";

export default function JotformReviewWidget() {
  useEffect(() => {
    const existingScript = document.getElementById(JOTFORM_SCRIPT_ID);
    existingScript?.remove();

    const script = document.createElement("script");
    script.id = JOTFORM_SCRIPT_ID;
    script.src = JOTFORM_SCRIPT_SRC;
    script.async = true;
    document.body.appendChild(script);

    return () => {
      script.remove();
      const container = document.getElementById(JOTFORM_WIDGET_ID);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, []);

  return <div id={JOTFORM_WIDGET_ID} />;
}
