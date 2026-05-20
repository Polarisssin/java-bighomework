import { createRoot, type Root } from "react-dom/client";
import { BodyScanPanel, type BodyScanPanelProps } from "./BodyScanPanel";

const roots = new WeakMap<HTMLElement, Root>();

export function mountBodyScan(el: HTMLElement, props: BodyScanPanelProps) {
  let root = roots.get(el);
  if (!root) {
    root = createRoot(el);
    roots.set(el, root);
  }
  root.render(<BodyScanPanel {...props} />);
}

export function updateBodyScan(el: HTMLElement, props: BodyScanPanelProps) {
  const root = roots.get(el);
  if (root) root.render(<BodyScanPanel {...props} />);
}

export function unmountBodyScan(el: HTMLElement) {
  const root = roots.get(el);
  if (root) {
    root.unmount();
    roots.delete(el);
  }
}
