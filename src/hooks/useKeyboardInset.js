import { useEffect } from "react";

function useKeyboardInset() {
  useEffect(() => {
    const viewport = window.visualViewport;

    if (!viewport) {
      return undefined;
    }

    const root = document.documentElement;

    function update() {
      root.style.setProperty(
        "--vv-height",
        `${viewport.height}px`
      );
      root.style.setProperty(
        "--vv-offset",
        `${viewport.offsetTop}px`
      );
    }

    update();

    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    window.addEventListener("orientationchange", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      window.removeEventListener(
        "orientationchange",
        update
      );
      root.style.removeProperty("--vv-height");
      root.style.removeProperty("--vv-offset");
    };
  }, []);
}

export default useKeyboardInset;
